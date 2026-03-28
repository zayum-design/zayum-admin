import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PluginService } from './plugin.service';
import {
  InstallPluginDto,
  InstallFromUrlDto,
  InstallFromMarketDto,
  SearchMarketDto,
} from './dto';
import { CliPublic } from '../../common/decorators/cli-public.decorator';

@Controller('plugin')
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  @CliPublic()
  async findAll() {
    return this.pluginService.findAll();
  }

  @Get('enabled')
  @CliPublic()
  async findEnabled() {
    return this.pluginService.findEnabled();
  }

  @Get('frontend')
  @CliPublic()
  async getFrontendPlugins() {
    return this.pluginService.getFrontendPlugins();
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.pluginService.findOne(name);
  }

  // 本地安装
  @Post('install')
  async install(@Body() dto: InstallPluginDto) {
    return this.pluginService.install(dto.pluginPath);
  }

  // 从 URL 安装
  @Post('install-from-url')
  async installFromUrl(@Body() dto: InstallFromUrlDto) {
    return this.pluginService.installFromUrl(
      dto.url,
      dto.hash,
      dto.hashAlgorithm,
      dto.autoEnable,
    );
  }

  // 从市场安装
  @Post('install-from-market')
  async installFromMarket(@Body() dto: InstallFromMarketDto) {
    return this.pluginService.installFromMarket(
      dto.name,
      dto.version,
      dto.marketUrl,
      dto.autoEnable,
    );
  }

  // 搜索市场
  @Post('market/search')
  @CliPublic()
  async searchMarket(@Body() dto: SearchMarketDto) {
    return this.pluginService.searchMarket(dto.keyword, dto.marketUrl);
  }

  // 检查更新
  @Get(':name/check-update')
  @CliPublic()
  async checkUpdate(
    @Param('name') name: string,
    @Query('marketUrl') marketUrl?: string,
  ) {
    return this.pluginService.checkUpdate(name, marketUrl);
  }

  // 更新插件
  @Post(':name/update')
  async update(
    @Param('name') name: string,
    @Body() dto: { version?: string; marketUrl?: string },
  ) {
    return this.pluginService.update(name, dto.version, dto.marketUrl);
  }

  @Post(':name/uninstall')
  async uninstall(@Param('name') name: string) {
    return this.pluginService.uninstall(name);
  }

  @Post(':name/enable')
  async enable(@Param('name') name: string) {
    return this.pluginService.enable(name);
  }

  @Post(':name/disable')
  async disable(@Param('name') name: string) {
    return this.pluginService.disable(name);
  }

  @Post(':name/config')
  async updateConfig(
    @Param('name') name: string,
    @Body() config: Record<string, any>,
  ) {
    return this.pluginService.updateConfig(name, config);
  }
}
