import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { IS_CLI_PUBLIC_KEY } from '../../../common/decorators/cli-public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 检查是否是 CLI 公开接口
    const isCliPublic = this.reflector.getAllAndOverride<boolean>(IS_CLI_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isCliPublic) {
      // 检查是否来自 CLI 请求
      const request = context.switchToHttp().getRequest();
      const cliHeader = request.headers['x-cli-request'];
      const userAgent = request.headers['user-agent'] || '';
      
      // 如果请求带有 CLI Header 或 User-Agent 包含 zayum-cli，则放行
      if (cliHeader === 'true' || userAgent.includes('zayum-cli')) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
