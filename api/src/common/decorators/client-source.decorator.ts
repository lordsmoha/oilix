import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  CLIENT_SOURCE_HEADER,
  parseClientSource,
  type ClientSource,
} from '../constants/client-source';

export const ReqClientSource = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClientSource => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    return parseClientSource(req.headers[CLIENT_SOURCE_HEADER]);
  },
);
