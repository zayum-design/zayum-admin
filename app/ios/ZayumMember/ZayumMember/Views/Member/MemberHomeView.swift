//
//  MemberHomeView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct MemberHomeView: View {
    @State private var memberStore = MemberStore.shared
    @State private var authStore = AuthStore.shared
    
    let quickActions: [QuickAction] = [
        QuickAction(title: "余额充值", icon: "wallet.bifold", color: .blue, path: "/recharge/balance"),
        QuickAction(title: "积分充值", icon: "gift", color: .orange, path: "/recharge/score"),
        QuickAction(title: "余额记录", icon: "list.bullet", color: .green, path: "/records/balance"),
        QuickAction(title: "积分记录", icon: "list.star", color: .purple, path: "/records/score"),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 会员信息卡片
                MemberInfoCard(
                    profile: memberStore.profile,
                    isAuthenticated: authStore.isAuthenticated,
                    onLoginTap: {
                        authStore.presentLoginSheet()
                    }
                )
                
                // 快捷入口网格
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    ForEach(quickActions) { action in
                        QuickActionButton(action: action) {
                            handleQuickAction(action)
                        }
                    }
                }
                
                // 最近余额记录
                if authStore.isAuthenticated {
                    RecentBalanceRecordsSection(
                        title: "最近余额变动",
                        records: Array(memberStore.balanceRecords.prefix(5))
                    )
                    
                    // 最近积分记录
                    RecentScoreRecordsSection(
                        title: "最近积分变动",
                        records: Array(memberStore.scoreRecords.prefix(5))
                    )
                } else {
                    // 未登录提示
                    NotLoggedInPrompt()
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("会员中心")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            if authStore.isAuthenticated {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(destination: ProfileView()) {
                        Image(systemName: "gearshape")
                            .foregroundStyle(.primary)
                    }
                }
            }
        }
        .task {
            await loadData()
        }
        .refreshable {
            await loadData()
        }
    }
    
    private func loadData() async {
        guard authStore.isAuthenticated else { return }
        await memberStore.fetchProfile()
        await memberStore.fetchBalanceRecords()
        await memberStore.fetchScoreRecords()
    }
    
    private func handleQuickAction(_ action: QuickAction) {
        if !authStore.isAuthenticated {
            authStore.presentLoginSheet()
        } else {
            NavigationManager.shared.navigate(to: action.path)
        }
    }
}

// MARK: - Recent Balance Records Section

struct RecentBalanceRecordsSection: View {
    let title: String
    let records: [BalanceRecord]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 标题栏
            HStack {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                NavigationLink(destination: BalanceRecordsView()) {
                    HStack(spacing: 4) {
                        Text("查看全部")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                    }
                    .foregroundStyle(.blue)
                }
            }
            
            // 记录列表
            if records.isEmpty {
                emptyState
            } else {
                VStack(spacing: 0) {
                    ForEach(records) { record in
                        BalanceRecordRow(record: record)
                        
                        if record.id != records.last?.id {
                            Divider()
                                .padding(.leading, 44)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemBackground))
                )
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "doc.text")
                .font(.system(size: 32))
                .foregroundStyle(.secondary)
            Text("暂无余额变动记录")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 100)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
        )
    }
}

// MARK: - Recent Score Records Section

struct RecentScoreRecordsSection: View {
    let title: String
    let records: [ScoreRecord]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 标题栏
            HStack {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                NavigationLink(destination: ScoreRecordsView()) {
                    HStack(spacing: 4) {
                        Text("查看全部")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                    }
                    .foregroundStyle(.blue)
                }
            }
            
            // 记录列表
            if records.isEmpty {
                emptyState
            } else {
                VStack(spacing: 0) {
                    ForEach(records) { record in
                        ScoreRecordRow(record: record)
                        
                        if record.id != records.last?.id {
                            Divider()
                                .padding(.leading, 44)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemBackground))
                )
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "star")
                .font(.system(size: 32))
                .foregroundStyle(.secondary)
            Text("暂无积分变动记录")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 100)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
        )
    }
}

// MARK: - Not Logged In Prompt

struct NotLoggedInPrompt: View {
    @State private var authStore = AuthStore.shared
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            
            Text("登录后查看更多信息")
                .font(.headline)
                .foregroundStyle(.primary)
            
            Text("登录后可以查看余额、积分记录，以及进行充值操作")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Button("立即登录") {
                authStore.presentLoginSheet()
            }
            .buttonStyle(.borderedProminent)
            .tint(.blue)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
        )
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        MemberHomeView()
    }
}
