import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FiltrationController } from './filtration.controller';
import { FiltrationService } from './filtration.service';

@Module({
  imports: [AuditModule],
  controllers: [FiltrationController],
  providers: [FiltrationService],
  exports: [FiltrationService],
})
export class FiltrationModule {}
