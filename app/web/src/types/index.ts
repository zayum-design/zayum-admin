// 会员信息
export interface Member {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  email: string | null;
  mobile: string;
  gender: string;
  birthday: string | null;
  status: string;
  score: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// 登录/注册请求
export interface LoginByPasswordDTO {
  phone: string;
  password: string;
}

export interface LoginBySmsDTO {
  phone: string;
  code: string;
}

export interface RegisterByPasswordDTO {
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterBySmsDTO {
  phone: string;
  code: string;
}

export interface SendSmsCodeDTO {
  phone: string;
  type: 'register' | 'login' | 'reset';
}

// 充值相关
export interface RechargeBalanceDTO {
  amount: number;
  paymentMethod?: string;
}

export interface RechargeScoreDTO {
  score: number;
}

// 余额记录
export interface BalanceRecord {
  id: number;
  userId: number;
  amount: number;
  beforeBalance: number;
  afterBalance: number;
  type: string;
  remark: string;
  createdAt: string;
}

// 积分记录
export interface ScoreRecord {
  id: number;
  userId: number;
  score: number;
  beforeScore: number;
  afterScore: number;
  type: string;
  remark: string;
  createdAt: string;
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 登录响应
export interface LoginResponse {
  user: Member;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}
