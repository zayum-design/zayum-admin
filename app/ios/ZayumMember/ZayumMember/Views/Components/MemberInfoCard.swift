//
//  MemberInfoCard.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct MemberInfoCard: View {
    let profile: Member?
    let isAuthenticated: Bool
    let onLoginTap: () -> Void
    
    init(profile: Member?, isAuthenticated: Bool = true, onLoginTap: @escaping () -> Void = {}) {
        self.profile = profile
        self.isAuthenticated = isAuthenticated
        self.onLoginTap = onLoginTap
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 头像和基本信息
            HStack(spacing: 16) {
                // 头像
                AvatarView(avatar: profile?.avatar, isAuthenticated: isAuthenticated)
                
                // 昵称和手机号
                VStack(alignment: .leading, spacing: 4) {
                    if isAuthenticated {
                        Text(profile?.nickname ?? profile?.username ?? "未设置昵称")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                        
                        Text(profile?.mobile ?? "未绑定手机号")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("未登录")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                        
                        Text("点击登录")
                            .font(.subheadline)
                            .foregroundStyle(.blue)
                    }
                }
                
                Spacer()
                
                if !isAuthenticated {
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary)
                        .font(.subheadline)
                }
            }
            
            Divider()
            
            // 余额和积分
            HStack(spacing: 0) {
                // 余额
                VStack(spacing: 4) {
                    Text("余额")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(isAuthenticated ? String(format: "¥%.2f", profile?.balance ?? 0) : "--")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundStyle(.blue)
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .frame(height: 40)
                
                // 积分
                VStack(spacing: 4) {
                    Text("积分")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(isAuthenticated ? "\(profile?.score ?? 0)" : "--")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundStyle(.orange)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            if !isAuthenticated {
                onLoginTap()
            }
        }
    }
}

// MARK: - Avatar View

struct AvatarView: View {
    let avatar: String?
    let size: CGFloat
    let isAuthenticated: Bool
    
    init(avatar: String?, size: CGFloat = 60, isAuthenticated: Bool = true) {
        self.avatar = avatar
        self.size = size
        self.isAuthenticated = isAuthenticated
    }
    
    var body: some View {
        Group {
            if isAuthenticated, let avatarUrl = avatar, !avatarUrl.isEmpty {
                AsyncImage(url: URL(string: avatarUrl)) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(width: size, height: size)
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        defaultAvatar
                    @unknown default:
                        defaultAvatar
                    }
                }
            } else {
                defaultAvatar
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(Color(.systemGray5), lineWidth: 2)
        )
    }
    
    private var defaultAvatar: some View {
        Image(systemName: isAuthenticated ? "person.circle.fill" : "person.crop.circle.badge.plus")
            .resizable()
            .scaledToFit()
            .foregroundStyle(isAuthenticated ? .gray : .blue.opacity(0.6))
    }
}

// MARK: - Preview

#Preview("已登录") {
    let sampleMember = Member(
        id: 1,
        username: "testuser",
        nickname: "测试用户",
        avatar: nil,
        email: "test@example.com",
        mobile: "138****8888",
        gender: .male,
        birthday: "1990-01-01",
        status: .normal,
        score: 1250,
        balance: 999.99,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01"
    )
    
    MemberInfoCard(profile: sampleMember, isAuthenticated: true)
        .padding()
        .background(Color(.systemGroupedBackground))
}

#Preview("未登录") {
    MemberInfoCard(profile: nil, isAuthenticated: false)
        .padding()
        .background(Color(.systemGroupedBackground))
}
