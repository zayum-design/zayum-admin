import request from './request';
import { token } from '../utils/token';

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      nickname: string;
      email?: string;
      avatar?: string;
      groupId: number;
      status: string;
    };
    token: {
      access_token: string;
      token_type: string;
      expires_in: number;
    };
  };
}

export interface ProfileResponse {
  code: number;
  message: string;
  data: {
    id: number;
    username: string;
    nickname: string;
    email?: string;
    avatar?: string;
    groupId: number;
    status: string;
    loginAt?: string;
    loginIp?: string;
  };
}

export const authService = {
  login: async (data: LoginDTO) => {
    const response = await request.post<LoginDTO, LoginResponse>('/api/admin/auth/login', data);
    if (response.data?.token?.access_token) {
      token.set(response.data.token.access_token);
    }
    return response;
  },

  logout: async () => {
    await request.post('/api/admin/auth/logout');
    token.remove();
  },

  getProfile: async () => {
    return request.get<any, LoginResponse>('/api/admin/auth/profile');
  },
};
