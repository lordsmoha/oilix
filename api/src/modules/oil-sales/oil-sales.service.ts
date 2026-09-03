import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OilSaleStatus,
  OilSource,
  OilStockMovementType,
  OilType,
  Prisma,
  OilSaleLineKind,
  OilPricingMode,
  OilContainerStockMovementType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { SeasonScopeService } from '../../common/season/season-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { REALTIME_ENTITIES } from '../realtime/realtime.constants';
import { CashRegisterService } from './cash-register.service';
import { currentDevice } from '../devices/device-context';
import type { OilDashboardQueryDto } from '../devices/dto/devices.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  computeSaleAmounts,
  computeSaleFromLines,
  computeStockSummary,
  computeContainerStockSummary,
  SALE_CALC_ERROR_AR,
  type SaleLineInput,
} from './oil-sales.math';
import {
  AddStockDto,
  AddContainerStockDto,
  CancelOilSaleDto,
  ContainerInventoryCountDto,
  ContainerLossDto,
  ContainerMovementQueryDto,
  ContainerStockAdjustmentDto,
  CreateOilContainerDto,
  CreateOilCustomerDto,
  CreateOilSaleDto,
  CreateOilSaleItemDto,
  InventoryCountDto,
  OilCustomerQueryDto,
  OilMovementQueryDto,
  OilReportQueryDto,
  OilSaleQueryDto,
  PreviewSaleDto,
  StockAdjustmentDto,
  UpdateOilContainerDto,
  UpdateOilCustomerDto,
  UpdateOilSalesSettingsDto,
} from './dto/oil-sales.dto';
import { hasPermission } from '../../common/permissions/permission-catalog';

import {
  allOilBuckets,
  OIL_SOURCES,
  OIL_TYPES,
  oilBucketKey,
  parseOilBucketKey,
  priceForOilType,
  OIL_SOURCE_LABELS,
  OIL_TYPE_LABELS,
} from './oil-catalog';

export const OIL_SETTING_KEYS = {
  PRICE_GREEN: 'oil_price_green',
  PRICE_TAIEB: 'oil_price_taieb',
  PRICE_DROU: 'oil_price_drou',
  PRICE_ZEBBOUCHE: 'oil_price_zebbouche',
  RECEIPT_HEADER: 'oil_receipt_header',
  RECEIPT_FOOTER: 'oil_receipt_footer',
} as const;

function dec(n: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(n);
}

function num(n: number | string | Prisma.Decimal | null | undefined): number {
  if (n == null) return 0;
  return Number(n);
}

function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function mapCalcError(err: unknown): never {
  const code = err instanceof Error ? err.message : 'INVALID';
  throw new BadRequestException(SALE_CALC_ERROR_AR[code] || 'قيم البيع غير صالحة');
}

@Injectable()
export class OilSalesService {
  constructor(
    private prisma: PrismaService,
    private seasonScope: SeasonScopeService,
    private audit: AuditService,
    private realtime: RealtimeService,
    private cashRegisters: CashRegisterService,
  ) {}

  private userSelect = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
  } as const;

  private emitSalesRealtime(
    entity: (typeof REALTIME_ENTITIES)[keyof typeof REALTIME_ENTITIES],
    action: string,
    seasonId: string,
    actorId: string,
    entityId?: string,
  ) {
    this.realtime.emit({
      entity,
      action,
      module: AUDIT_MODULES.OIL_SALES,
      seasonId,
      actorId,
      entityId,
    });
  }

  // ─── Settings ─────────────────────────────────────────────

  async getSettings() {
    const keys = Object.values(OIL_SETTING_KEYS);
    const rows = await this.prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      priceGreen: Number(map[OIL_SETTING_KEYS.PRICE_GREEN] ?? 900),
      priceTaieb: Number(map[OIL_SETTING_KEYS.PRICE_TAIEB] ?? 900),
      priceDrou: Number(map[OIL_SETTING_KEYS.PRICE_DROU] ?? 900),
      priceZebbouche: Number(map[OIL_SETTING_KEYS.PRICE_ZEBBOUCHE] ?? 900),
      receiptHeader: String(map[OIL_SETTING_KEYS.RECEIPT_HEADER] ?? ''),
      receiptFooter: String(
        map[OIL_SETTING_KEYS.RECEIPT_FOOTER] ?? 'شكراً لثقتكم · Oilix',
      ),
    };
  }

  async updateSettings(dto: UpdateOilSalesSettingsDto, userId: string) {
    const pairs: [string, unknown][] = [];
    if (dto.priceGreen != null) pairs.push([OIL_SETTING_KEYS.PRICE_GREEN, dto.priceGreen]);
    if (dto.priceTaieb != null) pairs.push([OIL_SETTING_KEYS.PRICE_TAIEB, dto.priceTaieb]);
    if (dto.priceDrou != null) pairs.push([OIL_SETTING_KEYS.PRICE_DROU, dto.priceDrou]);
    if (dto.priceZebbouche != null) {
      pairs.push([OIL_SETTING_KEYS.PRICE_ZEBBOUCHE, dto.priceZebbouche]);
    }
    if (dto.receiptHeader != null)
      pairs.push([OIL_SETTING_KEYS.RECEIPT_HEADER, dto.receiptHeader]);
    if (dto.receiptFooter != null)
      pairs.push([OIL_SETTING_KEYS.RECEIPT_FOOTER, dto.receiptFooter]);

    for (const [key, value] of pairs) {
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
    }

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSalesSettings',
      description: 'تحديث إعدادات بيع الزيت',
      newData: dto as unknown as Prisma.InputJsonValue,
    });

    return this.getSettings();
  }

  // ─── Balance lock helpers ─────────────────────────────────

  private async ensureBalance(
    tx: Prisma.TransactionClient,
    seasonId: string,
    oilSource: OilSource,
    oilType: OilType,
  ) {
    const existing = await tx.oilStockBalance.findUnique({
      where: { seasonId_oilSource_oilType: { seasonId, oilSource, oilType } },
    });
    if (existing) return existing;
    return tx.oilStockBalance.create({
      data: { seasonId, oilSource, oilType },
    });
  }

  /** Lock balance row FOR UPDATE inside a transaction. */
  private async lockBalance(
    tx: Prisma.TransactionClient,
    seasonId: string,
    oilSource: OilSource,
    oilType: OilType,
  ) {
    await this.ensureBalance(tx, seasonId, oilSource, oilType);
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        total_added: Prisma.Decimal;
        total_sold: Prisma.Decimal;
        theoretical_qty: Prisma.Decimal;
        physical_qty: Prisma.Decimal | null;
        version: number;
      }>
    >`
      SELECT id, total_added, total_sold, theoretical_qty, physical_qty, version
      FROM oil_stock_balances
      WHERE season_id = ${seasonId}
        AND oil_source = ${oilSource}::"OilSource"
        AND oil_type = ${oilType}::"OilType"
      FOR UPDATE
    `;
    if (!rows[0]) throw new BadRequestException('تعذر قفل رصيد المخزون');
    const r = rows[0];
    return {
      id: r.id,
      totalAdded: num(r.total_added),
      totalSold: num(r.total_sold),
      theoreticalQty: num(r.theoretical_qty),
      physicalQty: r.physical_qty == null ? null : num(r.physical_qty),
      version: r.version,
    };
  }

  private async ensureContainerBalance(
    tx: Prisma.TransactionClient,
    seasonId: string,
    containerId: string,
  ) {
    const existing = await tx.oilContainerStockBalance.findUnique({
      where: { seasonId_containerId: { seasonId, containerId } },
    });
    if (existing) return existing;
    return tx.oilContainerStockBalance.create({
      data: { seasonId, containerId },
    });
  }

  /** Lock container unit balance FOR UPDATE — independent of oil litres. */
  private async lockContainerBalance(
    tx: Prisma.TransactionClient,
    seasonId: string,
    containerId: string,
  ) {
    await this.ensureContainerBalance(tx, seasonId, containerId);
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        total_added: number;
        total_sold_empty: number;
        total_consumed_in_oil: number;
        total_damaged: number;
        theoretical_qty: number;
        physical_qty: number | null;
        version: number;
      }>
    >`
      SELECT id, total_added, total_sold_empty, total_consumed_in_oil, total_damaged,
             theoretical_qty, physical_qty, version
      FROM oil_container_stock_balances
      WHERE season_id = ${seasonId} AND container_id = ${containerId}
      FOR UPDATE
    `;
    if (!rows[0]) throw new BadRequestException('تعذر قفل مخزون الضلف');
    const r = rows[0];
    return {
      id: r.id,
      totalAdded: Number(r.total_added),
      totalSoldEmpty: Number(r.total_sold_empty),
      totalConsumedInOil: Number(r.total_consumed_in_oil),
      totalDamaged: Number(r.total_damaged),
      theoreticalQty: Number(r.theoretical_qty),
      physicalQty: r.physical_qty == null ? null : Number(r.physical_qty),
      version: r.version,
    };
  }

  // ─── Dashboard / stock summary ────────────────────────────

  async dashboard(query: OilDashboardQueryDto = {}, user?: JwtPayload) {
    const seasonId = await this.seasonScope.getSeasonId();
    await Promise.all(
      allOilBuckets().map((b) =>
        this.ensureBalancePublic(seasonId, b.oilSource, b.oilType),
      ),
    );

    const balances = await this.prisma.oilStockBalance.findMany({
      where: { seasonId },
    });

    const summarize = (source: OilSource, type: OilType) => {
      const b = balances.find((x) => x.oilSource === source && x.oilType === type);
      const summary = computeStockSummary({
        totalAdded: num(b?.totalAdded),
        totalSold: num(b?.totalSold),
        theoreticalQty: b?.theoreticalQty == null ? null : num(b.theoreticalQty),
        physicalQty: b?.physicalQty == null ? null : num(b.physicalQty),
      });
      return { ...summary, lastInventoryAt: b?.lastInventoryAt ?? null };
    };

    const bySource = Object.fromEntries(
      OIL_SOURCES.map((source) => [
        source,
        Object.fromEntries(
          OIL_TYPES.map((type) => [type, summarize(source, type)]),
        ),
      ]),
    ) as Record<
      OilSource,
      Record<
        OilType,
        ReturnType<typeof computeStockSummary> & { lastInventoryAt: Date | null }
      >
    >;

    const globalByType = Object.fromEntries(
      OIL_TYPES.map((type) => {
        const stored = summarize(OilSource.STORED, type);
        const farmer = summarize(OilSource.FARMER, type);
        return [
          type,
          {
            stored: stored.theoreticalQty,
            farmer: farmer.theoreticalQty,
            total: stored.theoreticalQty + farmer.theoreticalQty,
            storedLoss: stored.lossQty,
            farmerLoss: farmer.lossQty,
          },
        ];
      }),
    );

    /** @deprecated use bySource — kept for backward compatibility */
    const byType = Object.fromEntries(
      OIL_TYPES.map((type) => [type, summarize(OilSource.STORED, type)]),
    );

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const canViewAll =
      !user ||
      hasPermission(user.permissions, 'OIL_SALES_CASH_REGISTER_VIEW_ALL', user.role);
    const device = currentDevice();
    const todayWhere: Prisma.OilSaleWhereInput = {
      seasonId,
      status: OilSaleStatus.COMPLETED,
      saleDate: { gte: start, lte: end },
    };
    if (!canViewAll && device?.cashRegisterId) {
      todayWhere.cashRegisterId = device.cashRegisterId;
    } else {
      if (query.cashRegisterId) todayWhere.cashRegisterId = query.cashRegisterId;
      if (query.deviceId) todayWhere.deviceId = query.deviceId;
      if (query.userId) todayWhere.createdById = query.userId;
    }

    const globalTodayWhere: Prisma.OilSaleWhereInput = {
      seasonId,
      status: OilSaleStatus.COMPLETED,
      saleDate: { gte: start, lte: end },
    };

    const [todaySales, todayAggRow, registerGroups, registers] = await Promise.all([
      this.prisma.oilSale.findMany({
        where: todayWhere,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          createdBy: { select: this.userSelect },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      this.prisma.oilSale.aggregate({
        where: todayWhere,
        _count: true,
        _sum: {
          quantityL: true,
          grossAmount: true,
          totalAssistance: true,
          finalAmount: true,
        },
      }),
      this.prisma.oilSale.groupBy({
        by: ['cashRegisterId'],
        where: canViewAll ? globalTodayWhere : todayWhere,
        _count: true,
        _sum: { quantityL: true, finalAmount: true, totalAssistance: true },
      }),
      this.prisma.cashRegister.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      }),
    ]);

    const todayAgg = {
      count: todayAggRow._count,
      litres: num(todayAggRow._sum.quantityL),
      gross: num(todayAggRow._sum.grossAmount),
      assistance: num(todayAggRow._sum.totalAssistance),
      net: num(todayAggRow._sum.finalAmount),
    };

    const globalAggRow = canViewAll
      ? await this.prisma.oilSale.aggregate({
          where: globalTodayWhere,
          _count: true,
          _sum: { quantityL: true, grossAmount: true, totalAssistance: true, finalAmount: true },
        })
      : todayAggRow;

    const latestAdditions = await this.prisma.oilStockMovement.findMany({
      where: { seasonId, type: OilStockMovementType.STOCK_ADDITION },
      include: { user: { select: this.userSelect } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const todayItemStats = await this.prisma.oilSaleItem.groupBy({
      by: ['containerName', 'containerCapacityL'],
      where: {
        kind: OilSaleLineKind.CONTAINER,
        sale: todayWhere,
      },
      _sum: { containerCount: true, quantityL: true },
    });

    const containers = await this.prisma.oilContainer.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { capacityL: 'asc' }],
    });
    await Promise.all(
      containers.map((c) =>
        this.prisma.oilContainerStockBalance.upsert({
          where: { seasonId_containerId: { seasonId, containerId: c.id } },
          create: { seasonId, containerId: c.id },
          update: {},
        }),
      ),
    );
    const containerBalances = await this.prisma.oilContainerStockBalance.findMany({
      where: { seasonId, containerId: { in: containers.map((c) => c.id) } },
    });
    const containerStock = containers.map((c) => {
      const b = containerBalances.find((x) => x.containerId === c.id);
      const summary = computeContainerStockSummary({
        totalAdded: b?.totalAdded ?? 0,
        totalSoldEmpty: b?.totalSoldEmpty ?? 0,
        totalConsumedInOil: b?.totalConsumedInOil ?? 0,
        totalDamaged: b?.totalDamaged ?? 0,
        theoreticalQty: b?.theoreticalQty ?? null,
        physicalQty: b?.physicalQty ?? null,
      });
      return {
        id: c.id,
        name: c.name,
        capacityL: num(c.capacityL),
        minStock: c.minStock,
        sellingPrice: c.unitPrice == null ? null : num(c.unitPrice),
        ...summary,
        available: summary.theoreticalQty,
        lowStock: summary.theoreticalQty <= c.minStock,
      };
    });

    const todayByRegister = registers.map((r) => {
      const g = registerGroups.find((x) => x.cashRegisterId === r.id);
      return {
        cashRegisterId: r.id,
        code: r.code,
        name: r.name,
        count: g?._count ?? 0,
        litres: num(g?._sum.quantityL),
        assistance: num(g?._sum.totalAssistance),
        net: num(g?._sum.finalAmount),
      };
    });

    return {
      bySource,
      globalByType,
      byType,
      today: todayAgg,
      allRegistersToday: {
        count: globalAggRow._count,
        litres: num(globalAggRow._sum.quantityL),
        gross: num(globalAggRow._sum.grossAmount),
        assistance: num(globalAggRow._sum.totalAssistance),
        net: num(globalAggRow._sum.finalAmount),
      },
      todayByRegister,
      registers,
      currentRegisterId: device?.cashRegisterId ?? null,
      todayContainers: todayItemStats.map((r) => ({
        name: r.containerName,
        capacityL: num(r.containerCapacityL),
        count: r._sum.containerCount ?? 0,
        litres: num(r._sum.quantityL),
      })),
      containerStock,
      latestSales: todaySales,
      latestAdditions,
    };
  }

  private async ensureBalancePublic(
    seasonId: string,
    oilSource: OilSource,
    oilType: OilType,
  ) {
    await this.prisma.oilStockBalance.upsert({
      where: { seasonId_oilSource_oilType: { seasonId, oilSource, oilType } },
      create: { seasonId, oilSource, oilType },
      update: {},
    });
  }

  async stockOverview(oilSource?: OilSource) {
    const seasonId = await this.seasonScope.getSeasonId();
    const buckets = oilSource
      ? allOilBuckets().filter((b) => b.oilSource === oilSource)
      : allOilBuckets();
    await Promise.all(
      buckets.map((b) => this.ensureBalancePublic(seasonId, b.oilSource, b.oilType)),
    );
    const balances = await this.prisma.oilStockBalance.findMany({
      where: { seasonId, ...(oilSource ? { oilSource } : {}) },
    });
    return buckets.map(({ oilSource: src, oilType: type }) => {
      const b = balances.find((x) => x.oilSource === src && x.oilType === type)!;
      return {
        oilSource: src,
        oilType: type,
        ...computeStockSummary({
          totalAdded: num(b.totalAdded),
          totalSold: num(b.totalSold),
          theoreticalQty: num(b.theoreticalQty),
          physicalQty: b.physicalQty == null ? null : num(b.physicalQty),
        }),
        lastInventoryAt: b.lastInventoryAt,
        version: b.version,
      };
    });
  }

  // ─── Customers ────────────────────────────────────────────

  async listCustomers(query: OilCustomerQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const where: Prisma.OilSaleCustomerWhereInput = {
      seasonId,
      deletedAt: null,
    };
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { wilaya: { contains: q, mode: 'insensitive' } },
        { commune: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.oilSaleCustomer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { sales: { where: { status: OilSaleStatus.COMPLETED } } } },
        },
      }),
      this.prisma.oilSaleCustomer.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async createCustomer(dto: CreateOilCustomerDto, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const row = await this.prisma.oilSaleCustomer.create({
      data: {
        seasonId,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        wilaya: dto.wilaya?.trim() || null,
        commune: dto.commune?.trim() || null,
        notes: dto.notes?.trim() || null,
        createdById: userId,
      },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSaleCustomer',
      entityId: row.id,
      description: `زبون بيع زيت: ${row.name}`,
      newData: row as unknown as Prisma.InputJsonValue,
    });
    return row;
  }

  async updateCustomer(id: string, dto: UpdateOilCustomerDto, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const existing = await this.prisma.oilSaleCustomer.findFirst({
      where: { id, seasonId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('الزبون غير موجود');

    const row = await this.prisma.oilSaleCustomer.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        wilaya: dto.wilaya?.trim() || null,
        commune: dto.commune?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSaleCustomer',
      entityId: id,
      description: `تعديل زبون بيع زيت: ${row.name}`,
      oldData: existing as unknown as Prisma.InputJsonValue,
      newData: row as unknown as Prisma.InputJsonValue,
    });
    return row;
  }

  async customerDetail(id: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const customer = await this.prisma.oilSaleCustomer.findFirst({
      where: { id, seasonId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('الزبون غير موجود');

    const sales = await this.prisma.oilSale.findMany({
      where: { customerId: id, seasonId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { createdBy: { select: this.userSelect } },
    });

    const completed = sales.filter((s) => s.status === OilSaleStatus.COMPLETED);
    const totals = completed.reduce(
      (a, s) => {
        a.litres += num(s.quantityL);
        a.gross += num(s.grossAmount);
        a.assistance += num(s.totalAssistance);
        a.net += num(s.finalAmount);
        return a;
      },
      { litres: 0, gross: 0, assistance: 0, net: 0, count: completed.length },
    );

    return { customer, sales, totals };
  }

  // ─── Stock additions / inventory / adjustments ────────────

  async addStock(dto: AddStockDto, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const qty = Number(dto.quantityL);
    if (!(qty > 0)) throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockBalance(tx, seasonId, dto.oilSource, dto.oilType);
      const stockBefore = bal.theoreticalQty;
      const stockAfter = stockBefore + qty;
      const totalAdded = bal.totalAdded + qty;

      await tx.oilStockBalance.update({
        where: { id: bal.id },
        data: {
          totalAdded: dec(totalAdded),
          theoreticalQty: dec(stockAfter),
          version: { increment: 1 },
        },
      });

      const movement = await tx.oilStockMovement.create({
        data: {
          seasonId,
          oilSource: dto.oilSource,
          oilType: dto.oilType,
          type: OilStockMovementType.STOCK_ADDITION,
          quantityL: dec(qty),
          stockBefore: dec(stockBefore),
          stockAfter: dec(stockAfter),
          note: dto.note?.trim() || null,
          userId,
        },
        include: { user: { select: this.userSelect } },
      });

      return movement;
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilStockMovement',
      entityId: result.id,
      description: `إضافة مخزون ${OIL_SOURCE_LABELS[dto.oilSource]} / ${OIL_TYPE_LABELS[dto.oilType]}: +${qty} لتر`,
      newData: result as unknown as Prisma.InputJsonValue,
    });

    this.emitSalesRealtime(REALTIME_ENTITIES.OIL_STOCK, AUDIT_ACTIONS.CREATE, seasonId, userId, result.id);

    return result;
  }

  async inventoryCount(dto: InventoryCountDto, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const physical = Number(dto.physicalQty);
    if (!(physical >= 0)) throw new BadRequestException('الكمية الفعلية غير صالحة');

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockBalance(tx, seasonId, dto.oilSource, dto.oilType);
      const theoretical = bal.theoreticalQty;
      const difference = physical - theoretical;
      const lossQty = Math.max(0, theoretical - physical);

      const count = await tx.oilInventoryCount.create({
        data: {
          seasonId,
          oilSource: dto.oilSource,
          oilType: dto.oilType,
          theoreticalBefore: dec(theoretical),
          physicalQty: dec(physical),
          difference: dec(difference),
          lossQty: dec(lossQty),
          note: dto.note?.trim() || null,
          userId,
        },
      });

      await tx.oilStockBalance.update({
        where: { id: bal.id },
        data: {
          physicalQty: dec(physical),
          lastInventoryAt: new Date(),
          version: { increment: 1 },
        },
      });

      const movement = await tx.oilStockMovement.create({
        data: {
          seasonId,
          oilSource: dto.oilSource,
          oilType: dto.oilType,
          type: OilStockMovementType.INVENTORY_COUNT,
          quantityL: dec(difference),
          stockBefore: dec(theoretical),
          stockAfter: dec(theoretical),
          inventoryCountId: count.id,
          note: dto.note?.trim() || `جرد فعلي: ${physical} لتر`,
          userId,
        },
      });

      if (lossQty > 0) {
        await tx.oilStockMovement.create({
          data: {
            seasonId,
            oilSource: dto.oilSource,
            oilType: dto.oilType,
            type: OilStockMovementType.LOSS,
            quantityL: dec(-lossQty),
            stockBefore: dec(theoretical),
            stockAfter: dec(theoretical),
            inventoryCountId: count.id,
            note: `خسارة جرد: ${lossQty} لتر`,
            userId,
          },
        });
      }

      return { count, movement };
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.VALIDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilInventoryCount',
      entityId: result.count.id,
      description: `جرد ${dto.oilType}: فعلي ${physical} لتر`,
      newData: result.count as unknown as Prisma.InputJsonValue,
    });

    return result.count;
  }

  async adjustStock(dto: StockAdjustmentDto, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const delta = Number(dto.quantityL);
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestException('كمية التعديل غير صالحة');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockBalance(tx, seasonId, dto.oilSource, dto.oilType);
      const stockBefore = bal.theoreticalQty;
      const stockAfter = stockBefore + delta;
      if (stockAfter < -1e-9) {
        throw new BadRequestException('التعديل يؤدي إلى مخزون سالب');
      }

      // Adjustments update theoretical stock only — never inflate totalSold/totalAdded.
      await tx.oilStockBalance.update({
        where: { id: bal.id },
        data: {
          theoreticalQty: dec(stockAfter),
          version: { increment: 1 },
        },
      });

      return tx.oilStockMovement.create({
        data: {
          seasonId,
          oilSource: dto.oilSource,
          oilType: dto.oilType,
          type: OilStockMovementType.ADJUSTMENT,
          quantityL: dec(delta),
          stockBefore: dec(stockBefore),
          stockAfter: dec(stockAfter),
          note: dto.reason.trim(),
          userId,
        },
        include: { user: { select: this.userSelect } },
      });
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilStockMovement',
      entityId: result.id,
      description: `تعديل مخزون ${dto.oilType}: ${delta} لتر`,
      newData: result as unknown as Prisma.InputJsonValue,
    });

    return result;
  }

  async listMovements(query: OilMovementQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const where: Prisma.OilStockMovementWhereInput = { seasonId };
    if (query.oilSource) where.oilSource = query.oilSource;
    if (query.oilType) where.oilType = query.oilType;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(`${query.from}T00:00:00`);
      if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999`);
    }

    const [items, total] = await Promise.all([
      this.prisma.oilStockMovement.findMany({
        where,
        include: {
          user: { select: this.userSelect },
          sale: { select: { id: true, receiptNumber: true } },
          inventoryCount: { select: { id: true, physicalQty: true, lossQty: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.oilStockMovement.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async listInventoryCounts(oilSource?: OilSource, oilType?: OilType) {
    const seasonId = await this.seasonScope.getSeasonId();
    return this.prisma.oilInventoryCount.findMany({
      where: {
        seasonId,
        ...(oilSource ? { oilSource } : {}),
        ...(oilType ? { oilType } : {}),
      },
      include: { user: { select: this.userSelect } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ─── Sales ────────────────────────────────────────────────

  async previewSale(dto: PreviewSaleDto) {
    try {
      if (dto.items?.length) {
        const ids = dto.items.filter((i) => i.containerId).map((i) => i.containerId!);
        const containers = ids.length
          ? await this.prisma.oilContainer.findMany({ where: { id: { in: ids } } })
          : [];
        return this.previewFromItems(dto.items, dto, containers);
      }
      if (dto.quantityL == null || dto.unitPrice == null) {
        throw new Error('INVALID_QUANTITY');
      }
      return computeSaleAmounts({
        quantityL: dto.quantityL,
        unitPrice: dto.unitPrice,
        assistanceFixed: dto.assistanceFixed,
        assistancePercent: dto.assistancePercent,
      });
    } catch (e) {
      mapCalcError(e);
    }
  }

  private previewFromItems(
    items: CreateOilSaleItemDto[],
    assistance: { assistanceFixed?: number; assistancePercent?: number },
    containers?: Array<{ id: string; capacityL: Prisma.Decimal | number; unitPrice?: Prisma.Decimal | number | null }>,
  ) {
    const lines: SaleLineInput[] = items.map((it) => {
      const pack = containers?.find((c) => c.id === it.containerId);
      const cap =
        it.kind === 'CONTAINER' || it.kind === 'CONTAINER_ONLY'
          ? Number(pack?.capacityL ?? it.quantityL)
          : undefined;
      return {
        kind: it.kind,
        capacityL: cap,
        containerCount: it.containerCount,
        quantityL: it.quantityL,
        unitPrice: it.unitPrice,
        pricingMode: it.pricingMode,
        containerPrice: it.containerPrice,
      };
    });
    return computeSaleFromLines(lines, assistance);
  }

  async nextReceiptNumber() {
    const seasonId = await this.seasonScope.getSeasonId();
    const last = await this.prisma.oilSale.findFirst({
      where: { seasonId },
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });
    return { next: (last?.receiptNumber ?? 0) + 1, seasonId };
  }

  async createSale(
    dto: CreateOilSaleDto,
    userId: string,
    permissions: string[],
    isAdmin: boolean,
    role?: string,
  ) {
    const seasonId = await this.seasonScope.getSeasonId();
    const customer = await this.prisma.oilSaleCustomer.findFirst({
      where: { id: dto.customerId, seasonId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('الزبون غير موجود');

    const assistFixed = Number(dto.assistanceFixed ?? 0);
    const assistPct = Number(dto.assistancePercent ?? 0);
    if (assistFixed > 0 && !hasPermission(permissions, 'OIL_SALES_ASSISTANCE_FIXED', role)) {
      throw new ForbiddenException('ليس لديك صلاحية تطبيق مساعدة ثابتة');
    }
    if (assistPct > 0 && !hasPermission(permissions, 'OIL_SALES_ASSISTANCE_PERCENT', role)) {
      throw new ForbiddenException('ليس لديك صلاحية تطبيق مساعدة بالنسبة');
    }

    const overrideOil = !!dto.overrideStock;
    const overrideContainers = !!dto.overrideContainerStock;
    if (
      overrideOil &&
      !hasPermission(permissions, 'OIL_SALES_STOCK_OVERRIDE', role) &&
      !hasPermission(permissions, 'OIL_SALES_OVERRIDE', role)
    ) {
      throw new ForbiddenException('ليس لديك صلاحية تجاوز مخزون الزيت');
    }
    if (
      overrideContainers &&
      !hasPermission(permissions, 'OIL_SALES_CONTAINER_STOCK_OVERRIDE', role)
    ) {
      throw new ForbiddenException('ليس لديك صلاحية تجاوز مخزون الضلف');
    }

    const settings = await this.getSettings();
    const canChangeOilPrice =
      isAdmin || hasPermission(permissions, 'OIL_SALES_SALES_CHANGE_PRICE', role);
    const canChangeContainerPrice =
      isAdmin || hasPermission(permissions, 'OIL_SALES_CONTAINERS_CHANGE_PRICE', role);

    const rawItems: CreateOilSaleItemDto[] =
      dto.items?.length
        ? dto.items
        : [
            {
              kind: 'LOOSE',
              oilSource: dto.oilSource,
              oilType: dto.oilType,
              quantityL: dto.quantityL,
              unitPrice: dto.unitPrice ?? 0,
            },
          ];

    const hasOilLines = rawItems.some((i) => i.kind !== 'CONTAINER_ONLY');
    const hasEmptyLines = rawItems.some((i) => i.kind === 'CONTAINER_ONLY');
    if (hasOilLines && !hasPermission(permissions, 'OIL_SALES_SALES_CREATE', role)) {
      throw new ForbiddenException('ليس لديك صلاحية بيع الزيت');
    }
    if (hasEmptyLines && !hasPermission(permissions, 'OIL_SALES_CONTAINERS_SELL', role)) {
      throw new ForbiddenException('ليس لديك صلاحية بيع الضلف فارغة');
    }

    const containerIds = [
      ...new Set(
        rawItems
          .filter((i) => i.kind !== 'LOOSE' && i.containerId)
          .map((i) => i.containerId!),
      ),
    ];
    const containers = containerIds.length
      ? await this.prisma.oilContainer.findMany({
          where: { id: { in: containerIds }, deletedAt: null, isActive: true },
        })
      : [];

    const prepared = rawItems.map((it, idx) => {
      const pack =
        it.kind === 'CONTAINER' || it.kind === 'CONTAINER_ONLY'
          ? containers.find((c) => c.id === it.containerId)
          : undefined;
      if ((it.kind === 'CONTAINER' || it.kind === 'CONTAINER_ONLY') && !pack) {
        throw new BadRequestException('التعبئة غير موجودة أو غير نشطة');
      }

      const lineOilSource =
        it.kind === 'CONTAINER_ONLY'
          ? null
          : (it.oilSource ?? dto.oilSource ?? null);
      const lineOilType =
        it.kind === 'CONTAINER_ONLY' ? null : (it.oilType ?? dto.oilType ?? null);
      if (it.kind !== 'CONTAINER_ONLY' && (!lineOilSource || !lineOilType)) {
        throw new BadRequestException('حدد مصدر ونوع الزيت لسطر البيع');
      }

      let unitPrice = Number(it.unitPrice);
      let containerPrice = it.containerPrice;
      if (it.kind === 'CONTAINER_ONLY') {
        const catalog = pack?.unitPrice == null ? null : num(pack.unitPrice);
        if (!canChangeContainerPrice) {
          if (catalog == null) {
            throw new ForbiddenException('لا يوجد سعر بيع للضلف — يحتاج صلاحية تحديد السعر');
          }
          unitPrice = catalog;
          containerPrice = catalog;
        } else if (containerPrice == null && catalog != null) {
          containerPrice = catalog;
        }
      } else {
        const catalogPrice = lineOilType
          ? priceForOilType(settings, lineOilType)
          : 0;
        if (!canChangeOilPrice) unitPrice = catalogPrice;
      }

      const lineIn: SaleLineInput = {
        kind: it.kind,
        capacityL: pack ? num(pack.capacityL) : undefined,
        containerCount: it.containerCount,
        quantityL: it.quantityL,
        unitPrice,
        pricingMode: it.pricingMode,
        containerPrice,
      };
      let resolved;
      try {
        resolved = computeSaleFromLines([lineIn], { assistanceFixed: 0, assistancePercent: 0 });
      } catch (e) {
        mapCalcError(e);
      }
      const line = resolved.lines[0];
      return {
        idx,
        it: { ...it, unitPrice, containerPrice },
        pack,
        oilSource: lineOilSource,
        oilType: lineOilType,
        quantityL: line.quantityL,
        lineGross: line.lineGross,
        containerCount: line.containerCount,
      };
    });

    let amounts;
    try {
      amounts = computeSaleFromLines(
        prepared.map((p) => ({
          kind: p.it.kind,
          capacityL: p.pack ? num(p.pack.capacityL) : undefined,
          containerCount: p.it.containerCount,
          quantityL: p.it.quantityL,
          unitPrice: p.it.unitPrice,
          pricingMode: p.it.pricingMode,
          containerPrice: p.it.containerPrice,
        })),
        { assistanceFixed: assistFixed, assistancePercent: assistPct },
      );
    } catch (e) {
      mapCalcError(e);
    }

    const qty = amounts.quantityL;
    const avgUnit = qty > 0 ? amounts.grossAmount / qty : 0;
    const headerOilSource =
      prepared.find((p) => p.oilSource && p.quantityL > 0)?.oilSource ?? null;
    const headerOilType =
      prepared.find((p) => p.oilType && p.quantityL > 0)?.oilType ?? null;

    const oilByBucket = new Map<string, number>();
    for (const p of prepared) {
      if (p.quantityL > 0 && p.oilSource && p.oilType) {
        const key = oilBucketKey(p.oilSource, p.oilType);
        oilByBucket.set(key, (oilByBucket.get(key) ?? 0) + p.quantityL);
      }
    }
    const consumeByContainer = new Map<string, number>();
    const sellEmptyByContainer = new Map<string, number>();
    for (const p of prepared) {
      const count = p.containerCount ?? 0;
      if (!p.pack || count < 1) continue;
      if (p.it.kind === 'CONTAINER') {
        consumeByContainer.set(p.pack.id, (consumeByContainer.get(p.pack.id) ?? 0) + count);
      } else if (p.it.kind === 'CONTAINER_ONLY') {
        sellEmptyByContainer.set(p.pack.id, (sellEmptyByContainer.get(p.pack.id) ?? 0) + count);
      }
    }

    const oilBucketsToLock = [...oilByBucket.keys()].sort();
    const containerIdsToLock = [
      ...new Set([...consumeByContainer.keys(), ...sellEmptyByContainer.keys()]),
    ].sort();

    const device = this.cashRegisters.requireSalesDevice();
    const seasonForSession = seasonId;

    const sale = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`oil-receipt:${seasonId}`}))`;

      const session = await tx.cashRegisterSession.findFirst({
        where: {
          cashRegisterId: device.cashRegisterId!,
          status: 'OPEN',
          seasonId: seasonForSession,
        },
        include: { cashRegister: true, device: true },
      });
      if (!session) {
        throw new BadRequestException('يجب فتح الصندوق قبل إجراء عملية بيع.');
      }
      await tx.$queryRaw`SELECT id FROM cash_register_sessions WHERE id = ${session.id} FOR UPDATE`;
      const register = session.cashRegister;

      const oilLocks = new Map<
        string,
        Awaited<ReturnType<OilSalesService['lockBalance']>>
      >();
      for (const key of oilBucketsToLock) {
        const { oilSource, oilType } = parseOilBucketKey(key);
        oilLocks.set(key, await this.lockBalance(tx, seasonId, oilSource, oilType));
      }
      const containerLocks = new Map<
        string,
        Awaited<ReturnType<OilSalesService['lockContainerBalance']>>
      >();
      for (const id of containerIdsToLock) {
        containerLocks.set(id, await this.lockContainerBalance(tx, seasonId, id));
      }

      for (const [key, need] of oilByBucket) {
        const bal = oilLocks.get(key)!;
        if (!overrideOil && bal.theoreticalQty + 1e-9 < need) {
          const { oilSource, oilType } = parseOilBucketKey(key);
          throw new BadRequestException(
            `مخزون ${OIL_SOURCE_LABELS[oilSource]} / ${OIL_TYPE_LABELS[oilType]} غير كافٍ (المتاح: ${bal.theoreticalQty} لتر، المطلوب: ${need} لتر)`,
          );
        }
      }
      for (const id of containerIdsToLock) {
        const need =
          (consumeByContainer.get(id) ?? 0) + (sellEmptyByContainer.get(id) ?? 0);
        const bal = containerLocks.get(id)!;
        if (!overrideContainers && bal.theoreticalQty < need) {
          throw new BadRequestException(
            `مخزون الضلف غير كافٍ (المتاح: ${bal.theoreticalQty} قطعة، المطلوب: ${need} قطعة)`,
          );
        }
      }

      const last = await tx.oilSale.findFirst({
        where: { seasonId },
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true },
      });
      const receiptNumber = (last?.receiptNumber ?? 0) + 1;

      const created = await tx.oilSale.create({
        data: {
          seasonId,
          receiptNumber,
          customerId: dto.customerId,
          oilSource: headerOilSource,
          oilType: headerOilType,
          quantityL: dec(qty),
          unitPrice: dec(avgUnit),
          grossAmount: dec(amounts.grossAmount),
          assistanceFixed: dec(amounts.assistanceFixed),
          assistancePercent: dec(amounts.assistancePercent),
          assistancePercentAmount: dec(amounts.assistancePercentAmount),
          totalAssistance: dec(amounts.totalAssistance),
          finalAmount: dec(amounts.finalAmount),
          notes: dto.notes?.trim() || null,
          overrideStock: overrideOil,
          overrideContainerStock: overrideContainers,
          saleTime: nowTime(),
          createdById: userId,
          deviceId: device.id,
          cashRegisterId: register.id,
          cashSessionId: session.id,
          deviceCode: device.code,
          deviceName: device.name,
          cashRegisterCode: register.code,
          cashRegisterName: register.name,
          items: {
            create: prepared.map((p) => ({
              oilSource: p.oilSource,
              oilType: p.oilType,
              kind: p.it.kind as OilSaleLineKind,
              pricingMode: (p.it.pricingMode ?? 'PER_LITRE') as OilPricingMode,
              containerId: p.pack?.id ?? null,
              containerName:
                p.pack?.name ??
                (p.it.kind === 'LOOSE' ? 'لتر حر' : null),
              containerCapacityL: p.pack ? p.pack.capacityL : null,
              containerCount: p.containerCount,
              quantityL: dec(p.quantityL),
              unitPrice: dec(p.it.unitPrice),
              containerPrice:
                p.it.containerPrice != null ? dec(p.it.containerPrice) : null,
              lineGross: dec(p.lineGross),
              sortOrder: p.idx,
            })),
          },
        },
      });

      for (const [key, need] of oilByBucket) {
        const { oilSource, oilType } = parseOilBucketKey(key);
        const bal = oilLocks.get(key)!;
        const stockBefore = bal.theoreticalQty;
        const stockAfter = stockBefore - need;
        await tx.oilStockBalance.update({
          where: { id: bal.id },
          data: {
            totalSold: dec(bal.totalSold + need),
            theoreticalQty: dec(stockAfter),
            version: { increment: 1 },
          },
        });
        await tx.oilStockMovement.create({
          data: {
            seasonId,
            oilSource,
            oilType,
            type: OilStockMovementType.SALE,
            quantityL: dec(-need),
            stockBefore: dec(stockBefore),
            stockAfter: dec(stockAfter),
            saleId: created.id,
            note: overrideOil ? 'بيع مع تجاوز مخزون الزيت' : null,
            userId,
          },
        });
      }

      for (const id of containerIdsToLock) {
        const consumed = consumeByContainer.get(id) ?? 0;
        const soldEmpty = sellEmptyByContainer.get(id) ?? 0;
        let bal = containerLocks.get(id)!;
        if (consumed > 0) {
          const stockBefore = bal.theoreticalQty;
          const stockAfter = stockBefore - consumed;
          await tx.oilContainerStockBalance.update({
            where: { id: bal.id },
            data: {
              totalConsumedInOil: { increment: consumed },
              theoreticalQty: stockAfter,
              version: { increment: 1 },
            },
          });
          await tx.oilContainerStockMovement.create({
            data: {
              seasonId,
              containerId: id,
              type: OilContainerStockMovementType.OIL_SALE_CONSUMPTION,
              quantity: -consumed,
              stockBefore,
              stockAfter,
              saleId: created.id,
              note: overrideContainers ? 'بيع مع تجاوز مخزون الضلف' : null,
              userId,
            },
          });
          bal = { ...bal, theoreticalQty: stockAfter, totalConsumedInOil: bal.totalConsumedInOil + consumed };
        }
        if (soldEmpty > 0) {
          const stockBefore = bal.theoreticalQty;
          const stockAfter = stockBefore - soldEmpty;
          await tx.oilContainerStockBalance.update({
            where: { id: bal.id },
            data: {
              totalSoldEmpty: { increment: soldEmpty },
              theoreticalQty: stockAfter,
              version: { increment: 1 },
            },
          });
          await tx.oilContainerStockMovement.create({
            data: {
              seasonId,
              containerId: id,
              type: OilContainerStockMovementType.DIRECT_CONTAINER_SALE,
              quantity: -soldEmpty,
              stockBefore,
              stockAfter,
              saleId: created.id,
              note: overrideContainers ? 'بيع مع تجاوز مخزون الضلف' : null,
              userId,
            },
          });
        }
      }

      await tx.cashRegisterSession.update({
        where: { id: session.id },
        data: { cashSales: { increment: amounts.finalAmount } },
      });

      return created;
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSale',
      entityId: sale.id,
      description: `بيع #${sale.receiptNumber}`,
      newData: sale as unknown as Prisma.InputJsonValue,
    });

    this.emitSalesRealtime(REALTIME_ENTITIES.OIL_SALE, AUDIT_ACTIONS.CREATE, seasonId, userId, sale.id);
    this.emitSalesRealtime(REALTIME_ENTITIES.OIL_STOCK, AUDIT_ACTIONS.UPDATE, seasonId, userId);
    this.emitSalesRealtime(REALTIME_ENTITIES.CONTAINER_STOCK, AUDIT_ACTIONS.UPDATE, seasonId, userId);
    this.emitSalesRealtime(REALTIME_ENTITIES.CASH_SESSION, AUDIT_ACTIONS.UPDATE, seasonId, userId);

    return this.findSale(sale.id);
  }

  async cancelSale(
    id: string,
    dto: CancelOilSaleDto,
    userId: string,
  ) {
    const viewSeasonId = await this.seasonScope.getSeasonId();
    const existing = await this.prisma.oilSale.findFirst({
      where: { id, seasonId: viewSeasonId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!existing) throw new NotFoundException('البيع غير موجود');
    if (existing.status === OilSaleStatus.CANCELLED) {
      throw new BadRequestException('البيع ملغى مسبقاً');
    }

    const seasonId = existing.seasonId;
    const oilByBucket = new Map<string, number>();
    const consumeByContainer = new Map<string, number>();
    const sellEmptyByContainer = new Map<string, number>();

    if (existing.items.length) {
      for (const it of existing.items) {
        if (it.oilSource && it.oilType && num(it.quantityL) > 0) {
          const key = oilBucketKey(it.oilSource, it.oilType);
          oilByBucket.set(key, (oilByBucket.get(key) ?? 0) + num(it.quantityL));
        }
        const count = it.containerCount ?? 0;
        if (!it.containerId || count < 1) continue;
        if (it.kind === OilSaleLineKind.CONTAINER) {
          consumeByContainer.set(
            it.containerId,
            (consumeByContainer.get(it.containerId) ?? 0) + count,
          );
        } else if (it.kind === OilSaleLineKind.CONTAINER_ONLY) {
          sellEmptyByContainer.set(
            it.containerId,
            (sellEmptyByContainer.get(it.containerId) ?? 0) + count,
          );
        }
      }
    } else if (existing.oilSource && existing.oilType) {
      const key = oilBucketKey(existing.oilSource, existing.oilType);
      oilByBucket.set(key, num(existing.quantityL));
    }

    const originalContainerMoves = await this.prisma.oilContainerStockMovement.count({
      where: {
        saleId: id,
        type: {
          in: [
            OilContainerStockMovementType.OIL_SALE_CONSUMPTION,
            OilContainerStockMovementType.DIRECT_CONTAINER_SALE,
          ],
        },
      },
    });
    if (originalContainerMoves === 0) {
      consumeByContainer.clear();
      sellEmptyByContainer.clear();
    }

    const oilBucketsToLock = [...oilByBucket.keys()].sort();
    const containerIdsToLock = [
      ...new Set([...consumeByContainer.keys(), ...sellEmptyByContainer.keys()]),
    ].sort();

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM oil_sales WHERE id = ${id} FOR UPDATE`;
      const locked = await tx.oilSale.findUnique({ where: { id } });
      if (!locked || locked.status !== OilSaleStatus.COMPLETED) {
        throw new BadRequestException('البيع ملغى مسبقاً أو غير قابل للإلغاء');
      }

      if (existing.cashSessionId) {
        await tx.$queryRaw`SELECT id FROM cash_register_sessions WHERE id = ${existing.cashSessionId} FOR UPDATE`;
        const cashSession = await tx.cashRegisterSession.findUnique({
          where: { id: existing.cashSessionId },
        });
        if (!cashSession) {
          throw new BadRequestException('جلسة الصندوق المرتبطة بالبيع غير موجودة');
        }
        if (cashSession.status !== 'OPEN') {
          throw new BadRequestException(
            'لا يمكن إلغاء البيع بعد إغلاق الصندوق. أعد فتح الصندوق أو سجّل تسوية نقدية يدوياً.',
          );
        }
      }

      const oilLocks = new Map<
        string,
        Awaited<ReturnType<OilSalesService['lockBalance']>>
      >();
      for (const key of oilBucketsToLock) {
        const { oilSource, oilType } = parseOilBucketKey(key);
        oilLocks.set(key, await this.lockBalance(tx, seasonId, oilSource, oilType));
      }
      const containerLocks = new Map<
        string,
        Awaited<ReturnType<OilSalesService['lockContainerBalance']>>
      >();
      for (const cid of containerIdsToLock) {
        containerLocks.set(cid, await this.lockContainerBalance(tx, seasonId, cid));
      }

      const claimed = await tx.oilSale.updateMany({
        where: { id, status: OilSaleStatus.COMPLETED },
        data: {
          status: OilSaleStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancelReason: dto.reason?.trim() || null,
        },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('البيع ملغى مسبقاً أو غير قابل للإلغاء');
      }
      const sale = await tx.oilSale.findUniqueOrThrow({ where: { id } });

      for (const [key, qty] of oilByBucket) {
        const { oilSource, oilType } = parseOilBucketKey(key);
        const bal = oilLocks.get(key)!;
        const stockBefore = bal.theoreticalQty;
        const stockAfter = stockBefore + qty;
        await tx.oilStockBalance.update({
          where: { id: bal.id },
          data: {
            totalSold: dec(Math.max(0, bal.totalSold - qty)),
            theoreticalQty: dec(stockAfter),
            version: { increment: 1 },
          },
        });
        await tx.oilStockMovement.create({
          data: {
            seasonId,
            oilSource,
            oilType,
            type: OilStockMovementType.SALE_CANCELLATION,
            quantityL: dec(qty),
            stockBefore: dec(stockBefore),
            stockAfter: dec(stockAfter),
            saleId: id,
            note: dto.reason?.trim() || 'إلغاء بيع',
            userId,
          },
        });
      }

      for (const cid of containerIdsToLock) {
        let bal = containerLocks.get(cid)!;
        const consumed = consumeByContainer.get(cid) ?? 0;
        const soldEmpty = sellEmptyByContainer.get(cid) ?? 0;
        if (consumed > 0) {
          const stockBefore = bal.theoreticalQty;
          const stockAfter = stockBefore + consumed;
          await tx.oilContainerStockBalance.update({
            where: { id: bal.id },
            data: {
              totalConsumedInOil: Math.max(0, bal.totalConsumedInOil - consumed),
              theoreticalQty: stockAfter,
              version: { increment: 1 },
            },
          });
          await tx.oilContainerStockMovement.create({
            data: {
              seasonId,
              containerId: cid,
              type: OilContainerStockMovementType.SALE_CANCELLATION,
              quantity: consumed,
              stockBefore,
              stockAfter,
              saleId: id,
              note: dto.reason?.trim() || 'إلغاء بيع — استرجاع ضلف التعبئة',
              userId,
            },
          });
          bal = {
            ...bal,
            theoreticalQty: stockAfter,
            totalConsumedInOil: Math.max(0, bal.totalConsumedInOil - consumed),
          };
        }
        if (soldEmpty > 0) {
          const stockBefore = bal.theoreticalQty;
          const stockAfter = stockBefore + soldEmpty;
          await tx.oilContainerStockBalance.update({
            where: { id: bal.id },
            data: {
              totalSoldEmpty: Math.max(0, bal.totalSoldEmpty - soldEmpty),
              theoreticalQty: stockAfter,
              version: { increment: 1 },
            },
          });
          await tx.oilContainerStockMovement.create({
            data: {
              seasonId,
              containerId: cid,
              type: OilContainerStockMovementType.SALE_CANCELLATION,
              quantity: soldEmpty,
              stockBefore,
              stockAfter,
              saleId: id,
              note: dto.reason?.trim() || 'إلغاء بيع — استرجاع ضلف فارغة',
              userId,
            },
          });
        }
      }

      if (existing.cashSessionId) {
        await tx.cashRegisterSession.update({
          where: { id: existing.cashSessionId },
          data: { cashRefunds: { increment: existing.finalAmount } },
        });
      }

      return sale;
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CANCEL,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSale',
      entityId: id,
      description: `إلغاء بيع #${existing.receiptNumber}`,
      oldData: existing as unknown as Prisma.InputJsonValue,
      newData: updated as unknown as Prisma.InputJsonValue,
    });

    this.emitSalesRealtime(REALTIME_ENTITIES.OIL_SALE, AUDIT_ACTIONS.CANCEL, seasonId, userId, id);
    this.emitSalesRealtime(REALTIME_ENTITIES.OIL_STOCK, AUDIT_ACTIONS.UPDATE, seasonId, userId);
    this.emitSalesRealtime(REALTIME_ENTITIES.CONTAINER_STOCK, AUDIT_ACTIONS.UPDATE, seasonId, userId);
    this.emitSalesRealtime(REALTIME_ENTITIES.CASH_SESSION, AUDIT_ACTIONS.UPDATE, seasonId, userId);

    return this.findSale(id);
  }

  async findSale(id: string, opts?: { ignoreSeason?: boolean }) {
    const where: Prisma.OilSaleWhereInput = { id };
    if (!opts?.ignoreSeason) {
      where.seasonId = await this.seasonScope.getSeasonId();
    }
    const sale = await this.prisma.oilSale.findFirst({
      where,
      include: {
        customer: true,
        createdBy: { select: this.userSelect },
        cancelledBy: { select: this.userSelect },
        movements: { orderBy: { createdAt: 'asc' } },
        containerMovements: { orderBy: { createdAt: 'asc' } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!sale) throw new NotFoundException('البيع غير موجود');
    return sale;
  }

  async listSales(query: OilSaleQueryDto, user?: JwtPayload) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const where: Prisma.OilSaleWhereInput = { seasonId };

    const canViewAll =
      !user ||
      hasPermission(user.permissions, 'OIL_SALES_CASH_REGISTER_VIEW_ALL', user.role);
    const device = currentDevice();
    if (!canViewAll) {
      if (device?.cashRegisterId) {
        where.cashRegisterId = device.cashRegisterId;
      } else if (user) {
        where.createdById = user.sub;
      }
    } else {
      if (query.deviceId) where.deviceId = query.deviceId;
      if (query.cashRegisterId) where.cashRegisterId = query.cashRegisterId;
      if (query.userId) where.createdById = query.userId;
    }

    if (query.oilSource) where.oilSource = query.oilSource;
    if (query.oilType) where.oilType = query.oilType;
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.cashSessionId) where.cashSessionId = query.cashSessionId;
    if (query.receiptNumber != null) where.receiptNumber = query.receiptNumber;
    if (query.from || query.to) {
      where.saleDate = {};
      if (query.from) where.saleDate.gte = new Date(`${query.from}T00:00:00`);
      if (query.to) where.saleDate.lte = new Date(`${query.to}T23:59:59.999`);
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      const asNum = Number(q);
      where.OR = [
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { notes: { contains: q, mode: 'insensitive' } },
        ...(Number.isFinite(asNum) ? [{ receiptNumber: asNum }] : []),
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.oilSale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          createdBy: { select: this.userSelect },
        },
        orderBy: [{ saleDate: 'desc' }, { receiptNumber: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.oilSale.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async receiptPayload(id: string) {
    // Receipt URLs use sale UUID across seasons — do not 404 when viewing another season.
    const sale = await this.findSale(id, { ignoreSeason: true });
    const settings = await this.getSettings();
    const company = await this.prisma.setting.findMany({
      where: { key: { in: ['company_name', 'company_phone', 'company_address'] } },
    });
    const cmap = Object.fromEntries(company.map((c) => [c.key, c.value]));
    return {
      sale,
      settings,
      company: {
        name: String(cmap.company_name ?? 'Oilix'),
        phone: String(cmap.company_phone ?? ''),
        address: String(cmap.company_address ?? ''),
      },
    };
  }

  // ─── Reports ──────────────────────────────────────────────

  async salesReport(query: OilReportQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const where: Prisma.OilSaleWhereInput = {
      seasonId,
      status: OilSaleStatus.COMPLETED,
    };
    if (query.oilSource) where.oilSource = query.oilSource;
    if (query.oilType) where.oilType = query.oilType;
    if (query.userId) where.createdById = query.userId;
    if (query.deviceId) where.deviceId = query.deviceId;
    if (query.cashRegisterId) where.cashRegisterId = query.cashRegisterId;
    if (query.from || query.to) {
      where.saleDate = {};
      if (query.from) where.saleDate.gte = new Date(`${query.from}T00:00:00`);
      if (query.to) where.saleDate.lte = new Date(`${query.to}T23:59:59.999`);
    }

    const sales = await this.prisma.oilSale.findMany({ where });
    const summary = sales.reduce(
      (a, s) => {
        a.count += 1;
        a.litres += num(s.quantityL);
        a.gross += num(s.grossAmount);
        a.assistanceFixed += num(s.assistanceFixed);
        a.assistancePercentAmount += num(s.assistancePercentAmount);
        a.totalAssistance += num(s.totalAssistance);
        a.net += num(s.finalAmount);
        return a;
      },
      {
        count: 0,
        litres: 0,
        gross: 0,
        assistanceFixed: 0,
        assistancePercentAmount: 0,
        totalAssistance: 0,
        net: 0,
      },
    );

    const saleStats = (rows: typeof sales) => ({
      count: rows.length,
      litres: rows.reduce((s, r) => s + num(r.quantityL), 0),
      gross: rows.reduce((s, r) => s + num(r.grossAmount), 0),
      assistance: rows.reduce((s, r) => s + num(r.totalAssistance), 0),
      net: rows.reduce((s, r) => s + num(r.finalAmount), 0),
    });

    const byType = OIL_TYPES.map((t) => ({
      oilType: t,
      ...saleStats(sales.filter((s) => s.oilType === t)),
    }));

    const bySource = OIL_SOURCES.map((src) => ({
      oilSource: src,
      ...saleStats(sales.filter((s) => s.oilSource === src)),
    }));

    const stock = await this.stockOverview();
    const containerStock = await this.containerStockOverview();

    const byBucket = allOilBuckets().map(({ oilSource, oilType }) => {
      const bucketSales = sales.filter(
        (s) => s.oilSource === oilSource && s.oilType === oilType,
      );
      const stockRow = stock.find(
        (b) => b.oilSource === oilSource && b.oilType === oilType,
      );
      return {
        oilSource,
        oilType,
        ...saleStats(bucketSales),
        stock: stockRow ?? null,
      };
    });

    const globalByType = OIL_TYPES.map((type) => {
      const storedStock = stock.find(
        (b) => b.oilSource === OilSource.STORED && b.oilType === type,
      );
      const farmerStock = stock.find(
        (b) => b.oilSource === OilSource.FARMER && b.oilType === type,
      );
      return {
        oilType: type,
        stored: storedStock?.theoreticalQty ?? 0,
        farmer: farmerStock?.theoreticalQty ?? 0,
        total:
          (storedStock?.theoreticalQty ?? 0) + (farmerStock?.theoreticalQty ?? 0),
        ...saleStats(sales.filter((s) => s.oilType === type)),
      };
    });

    const byUserMap = new Map<
      string,
      { userId: string; count: number; litres: number; net: number }
    >();
    for (const s of sales) {
      const cur = byUserMap.get(s.createdById) ?? {
        userId: s.createdById,
        count: 0,
        litres: 0,
        net: 0,
      };
      cur.count += 1;
      cur.litres += num(s.quantityL);
      cur.net += num(s.finalAmount);
      byUserMap.set(s.createdById, cur);
    }

    const userIds = [...byUserMap.keys()];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: this.userSelect,
        })
      : [];

    const byUser = [...byUserMap.values()].map((u) => ({
      ...u,
      user: users.find((x) => x.id === u.userId) ?? null,
    }));

    const packaged = await this.prisma.oilSaleItem.groupBy({
      by: ['containerId', 'containerName', 'containerCapacityL'],
      where: {
        kind: OilSaleLineKind.CONTAINER,
        sale: where,
      },
      _sum: { containerCount: true, quantityL: true, lineGross: true },
    });
    const emptySold = await this.prisma.oilSaleItem.groupBy({
      by: ['containerId', 'containerName', 'containerCapacityL'],
      where: {
        kind: OilSaleLineKind.CONTAINER_ONLY,
        sale: where,
      },
      _sum: { containerCount: true, lineGross: true },
    });

    const byContainerMap = new Map<
      string,
      {
        containerId: string | null;
        name: string | null;
        capacityL: number;
        usedForOil: number;
        soldEmpty: number;
        litres: number;
        emptyRevenue: number;
      }
    >();
    const keyOf = (id: string | null, name: string | null, cap: number) =>
      `${id ?? name ?? 'x'}:${cap}`;
    for (const r of packaged) {
      const k = keyOf(r.containerId, r.containerName, num(r.containerCapacityL));
      byContainerMap.set(k, {
        containerId: r.containerId,
        name: r.containerName,
        capacityL: num(r.containerCapacityL),
        usedForOil: r._sum.containerCount ?? 0,
        soldEmpty: 0,
        litres: num(r._sum.quantityL),
        emptyRevenue: 0,
      });
    }
    for (const r of emptySold) {
      const k = keyOf(r.containerId, r.containerName, num(r.containerCapacityL));
      const cur = byContainerMap.get(k) ?? {
        containerId: r.containerId,
        name: r.containerName,
        capacityL: num(r.containerCapacityL),
        usedForOil: 0,
        soldEmpty: 0,
        litres: 0,
        emptyRevenue: 0,
      };
      cur.soldEmpty += r._sum.containerCount ?? 0;
      cur.emptyRevenue += num(r._sum.lineGross);
      byContainerMap.set(k, cur);
    }

    const byContainer = [...byContainerMap.values()];
    const containerSales = {
      unitsSoldEmpty: byContainer.reduce((s, r) => s + r.soldEmpty, 0),
      emptyRevenue: byContainer.reduce((s, r) => s + r.emptyRevenue, 0),
      unitsConsumedInOil: byContainer.reduce((s, r) => s + r.usedForOil, 0),
    };

    const byRegisterMap = new Map<
      string,
      { cashRegisterId: string | null; code: string | null; name: string | null; count: number; litres: number; net: number }
    >();
    const byDeviceMap = new Map<
      string,
      { deviceId: string | null; code: string | null; name: string | null; count: number; litres: number; net: number }
    >();
    for (const s of sales) {
      const rk = s.cashRegisterId ?? 'legacy';
      const rcur = byRegisterMap.get(rk) ?? {
        cashRegisterId: s.cashRegisterId,
        code: s.cashRegisterCode,
        name: s.cashRegisterName,
        count: 0,
        litres: 0,
        net: 0,
      };
      rcur.count += 1;
      rcur.litres += num(s.quantityL);
      rcur.net += num(s.finalAmount);
      byRegisterMap.set(rk, rcur);

      const dk = s.deviceId ?? 'legacy';
      const dcur = byDeviceMap.get(dk) ?? {
        deviceId: s.deviceId,
        code: s.deviceCode,
        name: s.deviceName,
        count: 0,
        litres: 0,
        net: 0,
      };
      dcur.count += 1;
      dcur.litres += num(s.quantityL);
      dcur.net += num(s.finalAmount);
      byDeviceMap.set(dk, dcur);
    }

    return {
      summary: {
        ...summary,
        oilRevenue: summary.gross - containerSales.emptyRevenue,
        containerRevenue: containerSales.emptyRevenue,
      },
      byType,
      bySource,
      byBucket,
      globalByType,
      byUser,
      byRegister: [...byRegisterMap.values()],
      byDevice: [...byDeviceMap.values()],
      stock,
      containerStock,
      byContainer,
      containerSales,
      containerConsumption: byContainer.map((r) => ({
        name: r.name,
        capacityL: r.capacityL,
        usedForOil: r.usedForOil,
      })),
    };
  }

  // ── Containers ────────────────────────────────────────────

  async listContainers(includeInactive = false) {
    const seasonId = await this.seasonScope.getSeasonId();
    const rows = await this.prisma.oilContainer.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { capacityL: 'asc' }],
    });
    const balances = await this.prisma.oilContainerStockBalance.findMany({
      where: { seasonId, containerId: { in: rows.map((r) => r.id) } },
    });
    return rows.map((c) => {
      const b = balances.find((x) => x.containerId === c.id);
      const stock = computeContainerStockSummary({
        totalAdded: b?.totalAdded ?? 0,
        totalSoldEmpty: b?.totalSoldEmpty ?? 0,
        totalConsumedInOil: b?.totalConsumedInOil ?? 0,
        totalDamaged: b?.totalDamaged ?? 0,
        theoreticalQty: b?.theoreticalQty ?? null,
        physicalQty: b?.physicalQty ?? null,
      });
      return {
        ...c,
        stock: {
          ...stock,
          available: stock.theoreticalQty,
          lastInventoryAt: b?.lastInventoryAt ?? null,
        },
      };
    });
  }

  async createContainer(dto: CreateOilContainerDto, userId: string) {
    const row = await this.prisma.oilContainer.create({
      data: {
        name: dto.name.trim(),
        capacityL: dec(dto.capacityL),
        sku: dto.sku?.trim() || null,
        costPrice: dto.costPrice != null ? dec(dto.costPrice) : null,
        unitPrice: dto.unitPrice != null ? dec(dto.unitPrice) : null,
        minStock: dto.minStock ?? 0,
        notes: dto.notes?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainer',
      entityId: row.id,
      description: `ضلف: ${row.name}`,
      newData: row as unknown as Prisma.InputJsonValue,
    });
    return row;
  }

  async updateContainer(id: string, dto: UpdateOilContainerDto, userId: string) {
    const existing = await this.prisma.oilContainer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('التعبئة غير موجودة');
    const row = await this.prisma.oilContainer.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        capacityL: dec(dto.capacityL),
        sku: dto.sku !== undefined ? dto.sku?.trim() || null : existing.sku,
        costPrice: dto.costPrice != null ? dec(dto.costPrice) : existing.costPrice,
        unitPrice: dto.unitPrice != null ? dec(dto.unitPrice) : existing.unitPrice,
        minStock: dto.minStock ?? existing.minStock,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : existing.notes,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainer',
      entityId: id,
      description: `تعديل ضلف: ${row.name}`,
      oldData: existing as unknown as Prisma.InputJsonValue,
      newData: row as unknown as Prisma.InputJsonValue,
    });
    return row;
  }

  async containerStockOverview() {
    return this.listContainers(true);
  }

  async addContainerStock(dto: AddContainerStockDto, userId: string) {
    const qty = Math.trunc(Number(dto.quantity));
    if (!(qty >= 1)) throw new BadRequestException('الكمية يجب أن تكون قطعة واحدة على الأقل');
    const container = await this.prisma.oilContainer.findFirst({
      where: { id: dto.containerId, deletedAt: null },
    });
    if (!container) throw new NotFoundException('التعبئة غير موجودة');
    const seasonId = await this.seasonScope.getSeasonId();

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockContainerBalance(tx, seasonId, dto.containerId);
      const stockBefore = bal.theoreticalQty;
      const stockAfter = stockBefore + qty;
      await tx.oilContainerStockBalance.update({
        where: { id: bal.id },
        data: {
          totalAdded: { increment: qty },
          theoreticalQty: stockAfter,
          version: { increment: 1 },
        },
      });
      return tx.oilContainerStockMovement.create({
        data: {
          seasonId,
          containerId: dto.containerId,
          type: OilContainerStockMovementType.STOCK_ADDITION,
          quantity: qty,
          stockBefore,
          stockAfter,
          unitCost: dto.unitCost != null ? dec(dto.unitCost) : null,
          note: dto.note?.trim() || null,
          userId,
        },
        include: { user: { select: this.userSelect }, container: true },
      });
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainerStockMovement',
      entityId: result.id,
      description: `إضافة مخزون ضلف ${container.name}: +${qty}`,
    });
    this.emitSalesRealtime(REALTIME_ENTITIES.CONTAINER_STOCK, AUDIT_ACTIONS.CREATE, seasonId, userId, result.id);
    return result;
  }

  async adjustContainerStock(dto: ContainerStockAdjustmentDto, userId: string) {
    const qty = Math.trunc(Number(dto.quantity));
    if (qty === 0) throw new BadRequestException('كمية التصحيح لا يمكن أن تكون صفراً');
    const container = await this.prisma.oilContainer.findFirst({
      where: { id: dto.containerId, deletedAt: null },
    });
    if (!container) throw new NotFoundException('التعبئة غير موجودة');
    const seasonId = await this.seasonScope.getSeasonId();

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockContainerBalance(tx, seasonId, dto.containerId);
      const stockBefore = bal.theoreticalQty;
      const stockAfter = stockBefore + qty;
      if (stockAfter < 0) {
        throw new BadRequestException('التعديل يؤدي إلى مخزون سالب');
      }
      // Adjustments update theoretical stock only — never inflate totalAdded/sold/damaged.
      await tx.oilContainerStockBalance.update({
        where: { id: bal.id },
        data: {
          theoreticalQty: stockAfter,
          version: { increment: 1 },
        },
      });
      return tx.oilContainerStockMovement.create({
        data: {
          seasonId,
          containerId: dto.containerId,
          type: OilContainerStockMovementType.ADJUSTMENT,
          quantity: qty,
          stockBefore,
          stockAfter,
          note: dto.reason.trim(),
          userId,
        },
        include: { user: { select: this.userSelect }, container: true },
      });
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainerStockMovement',
      entityId: result.id,
      description: `تصحيح مخزون ضلف ${container.name}: ${qty > 0 ? '+' : ''}${qty}`,
    });
    return result;
  }

  async recordContainerLoss(dto: ContainerLossDto, userId: string) {
    const qty = Math.trunc(Number(dto.quantity));
    if (!(qty >= 1)) throw new BadRequestException('حدد عدد القطع التالفة أو المفقودة');
    const container = await this.prisma.oilContainer.findFirst({
      where: { id: dto.containerId, deletedAt: null },
    });
    if (!container) throw new NotFoundException('التعبئة غير موجودة');
    const seasonId = await this.seasonScope.getSeasonId();
    const type =
      dto.type === 'LOSS'
        ? OilContainerStockMovementType.LOSS
        : OilContainerStockMovementType.DAMAGE;

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockContainerBalance(tx, seasonId, dto.containerId);
      if (bal.theoreticalQty < qty) {
        throw new BadRequestException(
          `المخزون النظري غير كافٍ لتسجيل التلف (المتاح: ${bal.theoreticalQty})`,
        );
      }
      const stockBefore = bal.theoreticalQty;
      const stockAfter = stockBefore - qty;
      await tx.oilContainerStockBalance.update({
        where: { id: bal.id },
        data: {
          totalDamaged: { increment: qty },
          theoreticalQty: stockAfter,
          version: { increment: 1 },
        },
      });
      return tx.oilContainerStockMovement.create({
        data: {
          seasonId,
          containerId: dto.containerId,
          type,
          quantity: -qty,
          stockBefore,
          stockAfter,
          note: dto.reason.trim(),
          userId,
        },
        include: { user: { select: this.userSelect }, container: true },
      });
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainerStockMovement',
      entityId: result.id,
      description: `${dto.type === 'LOSS' ? 'فقدان' : 'تلف'} ضلف ${container.name}: −${qty}`,
    });
    return result;
  }

  async containerInventoryCount(dto: ContainerInventoryCountDto, userId: string) {
    const physical = Math.trunc(Number(dto.physicalQty));
    if (!(physical >= 0)) throw new BadRequestException('الكمية الفعلية غير صالحة');
    const container = await this.prisma.oilContainer.findFirst({
      where: { id: dto.containerId, deletedAt: null },
    });
    if (!container) throw new NotFoundException('التعبئة غير موجودة');
    const seasonId = await this.seasonScope.getSeasonId();

    const result = await this.prisma.$transaction(async (tx) => {
      const bal = await this.lockContainerBalance(tx, seasonId, dto.containerId);
      const theoretical = bal.theoreticalQty;
      const difference = physical - theoretical;
      const lossQty = Math.max(0, theoretical - physical);
      const count = await tx.oilContainerInventoryCount.create({
        data: {
          seasonId,
          containerId: dto.containerId,
          theoreticalBefore: theoretical,
          physicalQty: physical,
          difference,
          lossQty,
          note: dto.note?.trim() || null,
          userId,
        },
      });
      await tx.oilContainerStockBalance.update({
        where: { id: bal.id },
        data: {
          physicalQty: physical,
          lastInventoryAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.oilContainerStockMovement.create({
        data: {
          seasonId,
          containerId: dto.containerId,
          type: OilContainerStockMovementType.INVENTORY_COUNT,
          quantity: 0,
          stockBefore: theoretical,
          stockAfter: theoretical,
          inventoryCountId: count.id,
          note: dto.note?.trim() || `جرد فعلي ${physical} (فرق ${difference})`,
          userId,
        },
      });
      return tx.oilContainerInventoryCount.findUniqueOrThrow({
        where: { id: count.id },
        include: { user: { select: this.userSelect }, container: true },
      });
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainerInventoryCount',
      entityId: result.id,
      description: `جرد ضلف ${container.name}: نظري ${result.theoreticalBefore} / فعلي ${physical}`,
    });
    return result;
  }

  async listContainerInventoryCounts(containerId?: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    return this.prisma.oilContainerInventoryCount.findMany({
      where: { seasonId, ...(containerId ? { containerId } : {}) },
      include: { user: { select: this.userSelect }, container: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async listContainerMovements(query: ContainerMovementQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const where: Prisma.OilContainerStockMovementWhereInput = { seasonId };
    if (query.containerId) where.containerId = query.containerId;
    if (query.type) {
      where.type = query.type as OilContainerStockMovementType;
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(`${query.from}T00:00:00`);
      if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999`);
    }
    const [items, total] = await Promise.all([
      this.prisma.oilContainerStockMovement.findMany({
        where,
        include: {
          user: { select: this.userSelect },
          container: { select: { id: true, name: true, capacityL: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.oilContainerStockMovement.count({ where }),
    ]);
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async deleteContainer(id: string, userId: string) {
    const existing = await this.prisma.oilContainer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('التعبئة غير موجودة');
    const used = await this.prisma.oilSaleItem.count({ where: { containerId: id } });
    if (used > 0) {
      const row = await this.prisma.oilContainer.update({
        where: { id },
        data: { isActive: false },
      });
      await this.audit.log({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.OIL_SALES,
        entity: 'OilContainer',
        entityId: id,
        description: `تعطيل تعبئة مستخدمة في بيوع سابقة: ${existing.name}`,
      });
      return { ...row, deactivated: true };
    }
    await this.prisma.oilContainer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilContainer',
      entityId: id,
      description: `حذف تعبئة: ${existing.name}`,
    });
    return { ok: true };
  }

  async deleteCustomer(id: string, userId: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const existing = await this.prisma.oilSaleCustomer.findFirst({
      where: { id, seasonId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('الزبون غير موجود');
    await this.prisma.oilSaleCustomer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.OIL_SALES,
      entity: 'OilSaleCustomer',
      entityId: id,
      description: `حذف زبون بيع زيت: ${existing.name}`,
    });
    return { ok: true };
  }
}
