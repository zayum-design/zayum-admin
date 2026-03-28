import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginController } from './plugin.controller';
import { PluginService } from './plugin.service';
import { PluginRegistry } from './plugin.registry';
import { PluginLoader } from './plugin.loader';
import { PluginDownloader } from './plugin.downloader';
import { MenuInjector } from './menu.injector';
import { SysPlugin } from '../../entities/sys-plugin.entity';
import { SysPluginMenu } from '../../entities/sys-plugin-menu.entity';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysPlugin, SysPluginMenu, SysAdminPermission]),
  ],
  controllers: [PluginController],
  providers: [PluginService, PluginRegistry, PluginLoader, PluginDownloader, MenuInjector],
  exports: [PluginService, PluginRegistry],
})
export class PluginModule {}
