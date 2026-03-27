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

export class UserScoreService {
  static async create(data: CreateUserScoreDto): Promise<UserScoreItem> {
    return request.post('/api/admin/user-score', data);
  }

  static async findAll(params?: QueryUserScoreDto): Promise<PaginatedResponse> {
    return request.get('/api/admin/user-score', { params });
  }

  static async findOne(id: number): Promise<UserScoreItem> {
    return request.get(`/api/admin/user-score/${id}`);
  }

  static async update(id: number, data: UpdateUserScoreDto): Promise<UserScoreItem> {
    return request.patch(`/api/admin/user-score/${id}`, data);
  }

  static async remove(id: number): Promise<void> {
    return request.delete(`/api/admin/user-score/${id}`);
  }
}
