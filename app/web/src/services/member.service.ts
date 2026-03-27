import request from './request';
import type { ApiResponse, Member, BalanceRecord, ScoreRecord } from '../types';

export const memberService = {
  // 获取会员信息
  getProfile(): Promise<ApiResponse<Member>> {
    return request.get('/member/profile');
  },

  // 更新会员信息
  updateProfile(data: Partial<Member>): Promise<ApiResponse<Member>> {
    return request.put('/member/profile', data);
  },

  // 获取余额记录
  getBalanceRecords(): Promise<ApiResponse<BalanceRecord[]>> {
    return request.get('/member/balance-records');
  },

  // 获取积分记录
  getScoreRecords(): Promise<ApiResponse<ScoreRecord[]>> {
    return request.get('/member/score-records');
  },
};
