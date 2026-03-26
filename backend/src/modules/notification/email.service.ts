import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfig } from '../../entities/sys-config.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SysConfig)
    private configRepository: Repository<SysConfig>,
  ) {
    this.initTransporter();
  }

  private async initTransporter() {
    const host = this.configService.get('EMAIL_HOST') || await this.getConfigValue('email_host');
    const port = this.configService.get('EMAIL_PORT') || await this.getConfigValue('email_port');
    const user = this.configService.get('EMAIL_USERNAME') || await this.getConfigValue('email_username');
    const pass = this.configService.get('EMAIL_PASSWORD') || await this.getConfigValue('email_password');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port || '587', 10),
        secure: parseInt(port || '587', 10) === 465,
        auth: { user, pass },
      });
    }
  }

  private async getConfigValue(key: string): Promise<string | null> {
    const config = await this.configRepository.findOne({ where: { configKey: key } });
    return config?.configValue || null;
  }

  async sendEmail(to: string, subject: string, content: string, attachments?: string[]): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('邮件服务未配置');
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM') || await this.getConfigValue('email_from_name'),
        to,
        subject,
        html: content,
        attachments: attachments?.map((path) => ({ path })),
      });
      return true;
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw error;
    }
  }

  async testEmail(to: string): Promise<boolean> {
    return this.sendEmail(
      to,
      '测试邮件',
      '<h2>这是一封测试邮件</h2><p>如果您收到此邮件，说明邮件配置正确。</p>',
    );
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}
