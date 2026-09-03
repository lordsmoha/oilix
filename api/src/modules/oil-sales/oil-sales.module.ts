import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OilSalesController } from './oil-sales.controller';
import { OilSalesService } from './oil-sales.service';
import { CashRegisterService } from './cash-register.service';

@Module({
  imports: [AuditModule],
  controllers: [OilSalesController],
  providers: [OilSalesService, CashRegisterService],
  exports: [OilSalesService, CashRegisterService],
})
export class OilSalesModule {}
