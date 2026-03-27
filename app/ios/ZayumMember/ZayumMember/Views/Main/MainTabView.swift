import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var memberStore = MemberStore.shared
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                MemberHomeView()
            }
            .tabItem {
                Label("首页", systemImage: "house")
            }
            .tag(0)
            
            NavigationStack {
                RecordsTabView()
            }
            .tabItem {
                Label("记录", systemImage: "list.bullet")
            }
            .tag(1)
            
            NavigationStack {
                ProfileTabView()
            }
            .tabItem {
                Label("我的", systemImage: "person")
            }
            .tag(2)
        }
    }
}

// 记录标签页
struct RecordsTabView: View {
    @State private var authStore = AuthStore.shared
    
    var body: some View {
        Group {
            if authStore.isAuthenticated {
                List {
                    NavigationLink("余额记录") {
                        BalanceRecordsView()
                    }
                    NavigationLink("积分记录") {
                        ScoreRecordsView()
                    }
                }
                .navigationTitle("记录")
            } else {
                // 未登录状态
                ContentUnavailableView {
                    Label("需要登录", systemImage: "person.crop.circle.badge.questionmark")
                } description: {
                    Text("登录后可以查看余额和积分记录")
                } actions: {
                    Button("立即登录") {
                        authStore.presentLoginSheet()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .navigationTitle("记录")
            }
        }
    }
}

// 我的标签页
struct ProfileTabView: View {
    @State private var authStore = AuthStore.shared
    
    var body: some View {
        List {
            if authStore.isAuthenticated {
                // 已登录状态
                NavigationLink("个人信息") {
                    ProfileView()
                }
                NavigationLink("余额充值") {
                    BalanceRechargeView()
                }
                NavigationLink("积分充值") {
                    ScoreRechargeView()
                }
                
                Section {
                    Button("退出登录") {
                        Task {
                            await AuthStore.shared.logout()
                        }
                    }
                    .foregroundStyle(.red)
                }
            } else {
                // 未登录状态
                Section {
                    Button {
                        authStore.presentLoginSheet()
                    } label: {
                        HStack {
                            Image(systemName: "person.crop.circle.badge.plus")
                                .foregroundStyle(.blue)
                            Text("登录 / 注册")
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("账户")
                } footer: {
                    Text("登录后可以管理个人信息、查看交易记录和进行充值")
                }
            }
        }
        .navigationTitle("我的")
    }
}
