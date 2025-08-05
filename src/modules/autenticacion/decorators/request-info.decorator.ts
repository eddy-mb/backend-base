import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorador para obtener información del request (IP, User-Agent)
 *
 * @example
 * @RequestInfo() info: { ip: string; userAgent: string }
 */
export const RequestInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return {
      ip:
        request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        request.ip ||
        request.socket?.remoteAddress ||
        'unknown',
      userAgent: request.get('User-Agent') || 'unknown',
    };
  },
);
