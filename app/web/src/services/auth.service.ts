import request from './request';
import type { 
  ApiResponse, 
  LoginResponse, 
  LoginByPasswordDTO, 
  LoginBySmsDTO,
  RegisterByPasswordDTO,
  RegisterBySmsDTO,
  SendSmsCodeDTO
} from '../types';

export const authService = {
  // 密码登录
  loginByPassword(data: LoginByPasswordDTO): Promise<ApiResponse<LoginResponse>> {
    return request.post('/member/login', {
      ...data,
      loginType: 'password',
    });
  },

  // 验证码登录
  loginBySms(data: LoginBySmsDTO): Promise<ApiResponse<LoginResponse>> {
    return request.post('/member/login', {
      ...data,
      loginType: 'sms',
    });
  },

  // 密码注册
  registerByPassword(data: RegisterByPasswordDTO): Promise<ApiResponse<LoginResponse>> {
    return request.post('/member/register', {
      phone: data.phone,
      password: data.password,
      registerType: 'password',
    });
  },

  // 验证码注册
  registerBySms(data: RegisterBySmsDTO): Promise<ApiResponse<LoginResponse>> {
    return request.post('/member/register', {
      ...data,
      registerType: 'sms',
    });
  },

  // 发送验证码
  sendSmsCode(data: SendSmsCodeDTO): Promise<ApiResponse<{ message: string }>> {
    return request.post('/member/sms-code', data);
  },

  // 登出
  logout(): Promise<ApiResponse<{ message: string }>> {
    return request.post('/member/logout');
  },
};
