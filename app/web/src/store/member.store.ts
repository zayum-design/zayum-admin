import { create } from 'zustand';
import { memberService } from '../services/member.service';
import type { Member, BalanceRecord, ScoreRecord } from '../types';

interface MemberState {
  profile: Member | null;
  balanceRecords: BalanceRecord[];
  scoreRecords: ScoreRecord[];
  isLoading: boolean;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Member>) => Promise<void>;
  fetchBalanceRecords: () => Promise<void>;
  fetchScoreRecords: () => Promise<void>;
}

export const useMemberStore = create<MemberState>((set) => ({
  profile: null,
  balanceRecords: [],
  scoreRecords: [],
  isLoading: false,

  // 获取会员信息
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await memberService.getProfile();
      set({ profile: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 更新会员信息
  updateProfile: async (data: Partial<Member>) => {
    set({ isLoading: true });
    try {
      const response = await memberService.updateProfile(data);
      set({ profile: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 获取余额记录
  fetchBalanceRecords: async () => {
    set({ isLoading: true });
    try {
      const response = await memberService.getBalanceRecords();
      set({ balanceRecords: response.data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 获取积分记录
  fetchScoreRecords: async () => {
    set({ isLoading: true });
    try {
      const response = await memberService.getScoreRecords();
      set({ scoreRecords: response.data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
