import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { deviceAls, deviceWriteBlockReason } from './device-context';
import { DevicesService } from './devices.service';

@Injectable()
export class DeviceInterceptor implements NestInterceptor {
  constructor(private devices: DevicesService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<{
      user?: { sub?: string };
      method: string;
      url: string;
      originalUrl?: string;
      headers?: Record<string, unknown>;
    }>();

    if (!req.user?.sub) return next.handle();

    const device = await this.devices.touchFromRequest(req);
    const workspace = this.devices.workspaceHintFromRequest(req);
    const url = req.originalUrl || req.url;
    const block = deviceWriteBlockReason(device, {
      method: req.method,
      url,
      workspace,
    });
    if (block) throw new ForbiddenException(block);

    return new Observable((subscriber) => {
      deviceAls.run({ device, workspace }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
