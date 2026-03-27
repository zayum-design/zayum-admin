import request from './request';

export interface UserScoreItem {
  id: number;
  user_id: number;
  admin_id: number;
  scene: string;
  change_score: number;
  before_score: number;
  after_score: number;
  remark: string;
  order_no: string;
  ip: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserScoreDto {
  user_id: number;
  admin_id?: number;
  scene: string;
  change_score: number;
  before_score: number;
  after_score: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

export interface UpdateUserScoreDto {
  user_id?: number;
  admin_id?: number;
  scene?: string;
  change_score?: number;
  before_score?: number;
  after_score?: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

export interface QueryUserScoreDto {
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
  list: UserScoreItem[];
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

export class UserScoreService {
  static async create(data: CreateUserScoreDto): Promise<UserScoreItem> {
    const res = await request.post<CreateUserScoreDto, ApiResponse<UserScoreItem>>('/api/admin/user-score', data);
    return res.data;
  }

  static async findAll(params?: QueryUserScoreDto): Promise<PaginatedResponse> {
    const res = await request.get<any, ApiResponse<PaginatedResponse>>('/api/admin/user-score', { params });
    return res.data;
  }

  static async findOne(id: number): Promise<UserScoreItem> {
    const res = await request.get<any, ApiResponse<UserScoreItem>>(`/api/admin/user-score/${id}`);
    return res.data;
  }

  static async update(id: number, data: UpdateUserScoreDto): Promise<UserScoreItem> {
    const res = await request.patch<UpdateUserScoreDto, ApiResponse<UserScoreItem>>(`/api/admin/user-score/${id}`, data);
    return res.data;
  }

  static async remove(id: number): Promise<void> {
    await request.delete<any, ApiResponse<void>>(`/api/admin/user-score/${id}`);
  }
}
