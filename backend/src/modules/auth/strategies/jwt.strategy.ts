import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAdmin } from '../../../entities/sys-admin.entity';

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(SysAdmin)
    private adminRepository: Repository<SysAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const admin = await this.adminRepository.findOne({
      where: { id: payload.sub },
      relations: ['group'],
    });

    if (!admin) {
      throw new UnauthorizedException('用户不存在');
    }

    if (admin.status === 'hidden') {
      throw new UnauthorizedException('账号已被禁用');
    }

    return admin;
  }
}
