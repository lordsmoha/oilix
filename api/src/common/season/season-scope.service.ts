import {
  BadRequestException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { Season } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { VIEW_SEASON_HEADER } from './season.constants';

@Injectable({ scope: Scope.REQUEST })
export class SeasonScopeService {
  private resolved = false;
  private seasonId!: string;
  private activeSeasonId!: string;
  private readOnly = false;
  private season: Season | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  private headerSeasonId(): string | undefined {
    const raw = this.request.headers[VIEW_SEASON_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  async ensureResolved(): Promise<void> {
    if (this.resolved) return;

    this.activeSeasonId = await this.settingsService.getActiveSeasonId();
    const viewId = this.headerSeasonId();

    if (viewId && viewId !== this.activeSeasonId) {
      const season = await this.prisma.season.findUnique({
        where: { id: viewId },
      });
      if (!season) {
        throw new BadRequestException('الموسم المحدد غير موجود');
      }
      this.seasonId = viewId;
      this.season = season;
      this.readOnly = true;
    } else {
      this.seasonId = this.activeSeasonId;
      this.season = await this.prisma.season.findUnique({
        where: { id: this.activeSeasonId },
      });
      this.readOnly = false;
    }

    this.resolved = true;
  }

  async getSeasonId(): Promise<string> {
    await this.ensureResolved();
    return this.seasonId;
  }

  async getActiveSeasonId(): Promise<string> {
    await this.ensureResolved();
    return this.activeSeasonId;
  }

  async isReadOnly(): Promise<boolean> {
    await this.ensureResolved();
    return this.readOnly;
  }

  async getSeason(): Promise<Season | null> {
    await this.ensureResolved();
    return this.season;
  }

  async getContext() {
    await this.ensureResolved();
    const active = await this.prisma.season.findUnique({
      where: { id: this.activeSeasonId },
    });
    return {
      activeSeason: active,
      viewSeason: this.season,
      viewSeasonId: this.seasonId,
      activeSeasonId: this.activeSeasonId,
      readOnly: this.readOnly,
    };
  }
}
