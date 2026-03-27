import request from './request';

export interface UserBalanceItem {
  id: number;
  user_id: number;
  admin_id: number;
  scene: string;
  change_balance: number;
  before_balance: number;
  after_balance: number;
  remark: string;
  order_no: string;
  ip: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserBalanceDto {
  user_id: number;
  admin_id?: number;
  scene: string;
  change_balance: number;
  before_balance: number;
  after_balance: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

export interface UpdateUserBalanceDto {
  user_id?: number;
  admin_id?: number;
  scene?: string;
  change_balance?: number;
  before_balance?: number;
  after_balance?: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

export interface QueryUserBalanceDto {
  user_id?: number;
  admin_id?: number;
  scene?: string;
  order_no?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse { 
  list: UserBalanceItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export class UserBalanceService {
  static async create(data: CreateUserBalanceDto): Promise<UserBalanceItem> {
    const res = await request.post<CreateUserBalanceDto, ApiResponse<UserBalanceItem>>('/api/admin/user-balance', data);
    return res.data;
  }

  static async findAll(params?: QueryUserBalanceDto): Promise<PaginatedResponse> {
    const res = await request.get<any, ApiResponse<PaginatedResponse>>('/api/admin/user-balance', { params });
    return res.data;
  }

  static async findOne(id: number): Promise<UserBalanceItem> {
    const res = await request.get<any, ApiResponse<UserBalanceItem>>(`/api/admin/user-balance/${id}`);
    return res.data;
  }

  static async update(id: number, data: UpdateUserBalanceDto): Promise<UserBalanceItem> {
    const res = await request.patch<UpdateUserBalanceDto, ApiResponse<UserBalanceItem>>(`/api/admin/user-balance/${id}`, data);
    return res.data;
  }

  static async remove(id: number): Promise<void> {
    await request.delete<any, ApiResponse<void>>(`/api/admin/user-balance/${id}`);
  }
}
