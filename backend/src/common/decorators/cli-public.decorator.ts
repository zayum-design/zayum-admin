import { SetMetadata } from '@nestjs/common';

/**
 * CLI 公开访问装饰器
 * 用于标记仅允许 CLI 工具访问的接口
 * 需要配合守卫使用
 */
export const IS_CLI_PUBLIC_KEY = 'isCliPublic';
export const CliPublic = () => SetMetadata(IS_CLI_PUBLIC_KEY, true);
