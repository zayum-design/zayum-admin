import request from './request';
import type { ApiResponse, RechargeBalanceDTO, RechargeScoreDTO } from '../types';

export const rechargeService = {
  // 余额充值
  rechargeBalance(data: RechargeBalanceDTO): Promise<ApiResponse<{ message: string }>> {
    return request.post('/member/recharge/balance', data);
  },

  // 积分充值
  rechargeScore(data: RechargeScoreDTO): Promise<ApiResponse<{ message: string }>> {
    return request.post('/member/recharge/score', data);
  },
};
