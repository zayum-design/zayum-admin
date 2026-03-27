import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { RechargeScoreDto } from './dto/recharge-score.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // 发送验证码
  @Public()
  @Post('sms-code')
  @HttpCode(HttpStatus.OK)
  async sendSmsCode(@Body() dto: SendSmsCodeDto) {
    const result = await this.memberService.sendSmsCode(dto);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  // 注册
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    let result;
    if (dto.registerType === 'password') {
      result = await this.memberService.registerByPassword(dto);
    } else {
      result = await this.memberService.registerBySms(dto);
    }
    return {
      code: 200,
      message: '注册成功',
      data: result,
    };
  }

  // 登录
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    let result;
    if (dto.loginType === 'password') {
      result = await this.memberService.loginByPassword(dto);
    } else {
      result = await this.memberService.loginBySms(dto);
    }
    return {
      code: 200,
      message: '登录成功',
      data: result,
    };
  }

  // 获取会员信息
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const result = await this.memberService.getProfile(req.user.sub);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  // 更新会员信息
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const result = await this.memberService.updateProfile(req.user.sub, dto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  // 余额充值
  @UseGuards(JwtAuthGuard)
  @Post('recharge/balance')
  async rechargeBalance(@Request() req, @Body() dto: RechargeBalanceDto) {
    const result = await this.memberService.rechargeBalance(req.user.sub, dto);
    return {
      code: 200,
      message: '充值成功',
      data: result,
    };
  }

  // 积分充值
  @UseGuards(JwtAuthGuard)
  @Post('recharge/score')
  async rechargeScore(@Request() req, @Body() dto: RechargeScoreDto) {
    const result = await this.memberService.rechargeScore(req.user.sub, dto);
    return {
      code: 200,
      message: '充值成功',
      data: result,
    };
  }

  // 获取余额记录
  @UseGuards(JwtAuthGuard)
  @Get('balance-records')
  async getBalanceRecords(@Request() req) {
    const result = await this.memberService.getBalanceRecords(req.user.sub);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  // 获取积分记录
  @UseGuards(JwtAuthGuard)
  @Get('score-records')
  async getScoreRecords(@Request() req) {
    const result = await this.memberService.getScoreRecords(req.user.sub);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  // 登出
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return {
      code: 200,
      message: '登出成功',
      data: null,
    };
  }
}
