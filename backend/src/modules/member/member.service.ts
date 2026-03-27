import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysUser } from '../../entities/sys-user.entity';
import { SmsCode } from '../../entities/sms-code.entity';
import { SysUserBalanceEntity } from '../../entities/sys-user-balance.entity';
import { SysUserScoreEntity } from '../../entities/sys-user-score.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { RechargeScoreDto } from './dto/recharge-score.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SmsCode)
    private smsCodeRepository: Repository<SmsCode>,
    @InjectRepository(SysUserBalanceEntity)
    private userBalanceRepository: Repository<SysUserBalanceEntity>,
    @InjectRepository(SysUserScoreEntity)
    private userScoreRepository: Repository<SysUserScoreEntity>,
    private jwtService: JwtService,
  ) {}

  // 发送验证码
  async sendSmsCode(dto: SendSmsCodeDto) {
    const { phone, type } = dto;

    // 检查手机号是否已注册（注册时）
    if (type === 'register') {
      const existingUser = await this.userRepository.findOne({
        where: { mobile: phone },
      });
      if (existingUser) {
        throw new BadRequestException('该手机号已注册');
      }
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码
    const smsCode = this.smsCodeRepository.create({
      mobile: phone,
      code,
      type,
      expiredAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
      used: false,
    });
    await this.smsCodeRepository.save(smsCode);

    // TODO: 接入真实的短信服务
    console.log(`[SMS] 向 ${phone} 发送验证码: ${code}, 类型: ${type}`);

    return { message: '验证码已发送' };
  }

  // 验证验证码
  private async verifySmsCode(phone: string, code: string | undefined, type: string) {
    if (!code) {
      throw new BadRequestException('请输入验证码');
    }

    const smsCode = await this.smsCodeRepository.findOne({
      where: {
        mobile: phone,
        code,
        type,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!smsCode) {
      throw new BadRequestException('验证码错误或已过期');
    }

    if (smsCode.expiredAt < new Date()) {
      throw new BadRequestException('验证码已过期');
    }

    // 标记为已使用
    smsCode.used = true;
    await this.smsCodeRepository.save(smsCode);

    return true;
  }

  // 密码注册
  async registerByPassword(dto: RegisterDto) {
    const { phone, password } = dto;

    // 检查手机号是否已注册
    const existingUser = await this.userRepository.findOne({
      where: { mobile: phone },
    });
    if (existingUser) {
      throw new BadRequestException('该手机号已注册');
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password!, 10);
    const user = this.userRepository.create({
      mobile: phone,
      username: phone,
      nickname: `用户${phone.slice(-4)}`,
      password: hashedPassword,
      groupId: 2, // 默认用户组
      status: 'normal',
      score: 0,
      balance: 0,
    });

    await this.userRepository.save(user);

    // 生成 token
    const token = this.jwtService.sign({ sub: user.id, mobile: user.mobile });

    const { password: _, ...result } = user;
    return {
      user: result,
      token: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 7200,
      },
    };
  }

  // 验证码注册
  async registerBySms(dto: RegisterDto) {
    const { phone, code } = dto;

    // 验证验证码
    await this.verifySmsCode(phone, code, 'register');

    // 检查手机号是否已注册
    const existingUser = await this.userRepository.findOne({
      where: { mobile: phone },
    });
    if (existingUser) {
      throw new BadRequestException('该手机号已注册');
    }

    // 创建用户（生成随机密码）
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const user = this.userRepository.create({
      mobile: phone,
      username: phone,
      nickname: `用户${phone.slice(-4)}`,
      password: hashedPassword,
      groupId: 2, // 默认用户组
      status: 'normal',
      score: 0,
      balance: 0,
    });

    await this.userRepository.save(user);

    // 生成 token
    const token = this.jwtService.sign({ sub: user.id, mobile: user.mobile });

    const { password: _, ...result } = user;
    return {
      user: result,
      token: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 7200,
      },
    };
  }

  // 密码登录
  async loginByPassword(dto: LoginDto) {
    const { phone, password } = dto;

    const user = await this.userRepository.findOne({
      where: { mobile: phone },
    });

    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    if (user.status !== 'normal') {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password!, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    // 生成 token
    const token = this.jwtService.sign({ sub: user.id, mobile: user.mobile });

    const { password: _, ...result } = user;
    return {
      user: result,
      token: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 7200,
      },
    };
  }

  // 验证码登录
  async loginBySms(dto: LoginDto) {
    const { phone, code } = dto;

    // 验证验证码
    await this.verifySmsCode(phone, code, 'login');

    const user = await this.userRepository.findOne({
      where: { mobile: phone },
    });

    if (!user) {
      throw new UnauthorizedException('该手机号未注册');
    }

    if (user.status !== 'normal') {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成 token
    const token = this.jwtService.sign({ sub: user.id, mobile: user.mobile });

    const { password: _, ...result } = user;
    return {
      user: result,
      token: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 7200,
      },
    };
  }

  // 获取会员信息
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  // 更新会员信息
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 更新字段
    if (dto.nickname) user.nickname = dto.nickname;
    if (dto.avatar) user.avatar = dto.avatar;
    if (dto.email) user.email = dto.email;
    if (dto.gender) user.gender = dto.gender;
    if (dto.birthday) user.birthday = new Date(dto.birthday);

    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  // 余额充值
  async rechargeBalance(userId: number, dto: RechargeBalanceDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const beforeBalance = parseFloat(user.balance.toString());
    const amount = dto.amount;
    const afterBalance = beforeBalance + amount;

    // 更新用户余额
    user.balance = afterBalance;
    await this.userRepository.save(user);

    // 记录余额变动
    const balanceRecord = this.userBalanceRepository.create({
      user_id: userId,
      change_balance: amount,
      before_balance: beforeBalance,
      after_balance: afterBalance,
      scene: 'recharge',
      remark: `余额充值 ¥${amount}`,
    });
    await this.userBalanceRepository.save(balanceRecord);

    return { message: '充值成功', balance: afterBalance };
  }

  // 积分充值
  async rechargeScore(userId: number, dto: RechargeScoreDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const beforeScore = parseFloat(user.score.toString());
    const score = dto.score;
    const afterScore = beforeScore + score;

    // 更新用户积分
    user.score = afterScore;
    await this.userRepository.save(user);

    // 记录积分变动
    const scoreRecord = this.userScoreRepository.create({
      user_id: userId,
      change_score: score,
      before_score: beforeScore,
      after_score: afterScore,
      scene: 'recharge',
      remark: `积分充值 ${score}`,
    });
    await this.userScoreRepository.save(scoreRecord);

    return { message: '充值成功', score: afterScore };
  }

  // 获取余额记录
  async getBalanceRecords(userId: number) {
    const records = await this.userBalanceRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    // 转换为前端需要的格式
    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      amount: parseFloat(record.change_balance.toString()),
      beforeBalance: parseFloat(record.before_balance.toString()),
      afterBalance: parseFloat(record.after_balance.toString()),
      type: record.scene,
      remark: record.remark,
      createdAt: record.created_at,
    }));
  }

  // 获取积分记录
  async getScoreRecords(userId: number) {
    const records = await this.userScoreRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    // 转换为前端需要的格式
    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      score: parseFloat(record.change_score.toString()),
      beforeScore: parseFloat(record.before_score.toString()),
      afterScore: parseFloat(record.after_score.toString()),
      type: record.scene,
      remark: record.remark,
      createdAt: record.created_at,
    }));
  }
}
