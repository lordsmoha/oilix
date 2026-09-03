import { Global, Module, Scope } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ReadOnlySeasonGuard } from '../guards/read-only-season.guard';
import { SettingsModule } from '../../modules/settings/settings.module';
import { SeasonScopeService } from './season-scope.service';
import { SeasonsController } from './seasons.controller';

@Global()
@Module({
  imports: [SettingsModule],
  controllers: [SeasonsController],
  providers: [
    SeasonScopeService,
    {
      provide: APP_GUARD,
      scope: Scope.REQUEST,
      useClass: ReadOnlySeasonGuard,
    },
  ],
  exports: [SeasonScopeService],
})
export class SeasonModule {}
