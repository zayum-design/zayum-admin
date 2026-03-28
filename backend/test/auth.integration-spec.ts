import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SysAdmin } from '../src/entities/sys-admin.entity';
import { SysAdminGroup } from '../src/entities/sys-admin-group.entity';
import * as bcrypt from 'bcrypt';

describe('认证模块 (Auth Module) 集成测试', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let testAdmin: SysAdmin;

  beforeAll(async () => {
    // 创建测试模块
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 从模块中获取数据源
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 创建测试管理员用户
    const adminGroupRepo = dataSource.getRepository(SysAdminGroup);
    const adminRepo = dataSource.getRepository(SysAdmin);

    // 创建超级管理员组
    const superAdminGroup = adminGroupRepo.create({
      name: '测试管理员组',
      description: '测试用的管理员组',
      permissions: JSON.stringify(['*']),
      status: 'normal',
    });
    await adminGroupRepo.save(superAdminGroup);

    // 创建测试管理员
    const hashedPassword = await bcrypt.hash('Test@123456', 10);
    testAdmin = adminRepo.create({
      groupId: superAdminGroup.id,
      username: 'testadmin',
      nickname: '测试管理员',
      password: hashedPassword,
      email: 'testadmin@example.com',
      mobile: '13800138002',
      status: 'normal',
      loginFailure: 0,
    });
    await adminRepo.save(testAdmin);
  });

  afterAll(async () => {
    // 清理测试数据（事务会自动回滚，所以这里不需要手动清理）
    await app.close();
  });

  describe('认证流程测试', () => {
    it('POST /api/admin/auth/login - 成功登录', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          username: 'testadmin',
          password: 'Test@123456',
        })
        .expect(200);

      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('username', 'testadmin');

      // 保存token用于后续测试
      authToken = response.body.data.token.access_token;
    });

    it('POST /api/admin/auth/login - 密码错误', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          username: 'testadmin',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('POST /api/admin/auth/login - 用户不存在', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Test@123456',
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('POST /api/admin/auth/login - 验证请求参数', async () => {
      // 缺少用户名
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          password: 'Test@123456',
        })
        .expect(400);

      // 缺少密码
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          username: 'testadmin',
        })
        .expect(400);
    });
  });

  describe('需要认证的接口测试', () => {
    it('GET /api/admin/auth/profile - 获取个人资料（未认证）', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/auth/profile')
        .expect(401);
    });

    it('GET /api/admin/auth/profile - 获取个人资料（已认证）', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('username', 'testadmin');
      expect(response.body.data).toHaveProperty('email', 'testadmin@example.com');
    });

    it('GET /api/admin/auth/permissions - 获取权限列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/auth/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/admin/auth/menus - 获取菜单列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/auth/menus')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/admin/auth/logout - 登出', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('message');

      // 登出后token应该失效
      await request(app.getHttpServer())
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});