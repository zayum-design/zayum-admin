import SwiftUI

struct SidebarView: View {
    @State private var selectedItem: SidebarItem? = .home
    @State private var columnVisibility: NavigationSplitViewVisibility = .automatic
    
    enum SidebarItem: String, CaseIterable, Identifiable {
        case home = "首页"
        case profile = "个人信息"
        case balanceRecords = "余额记录"
        case scoreRecords = "积分记录"
        case balanceRecharge = "余额充值"
        case scoreRecharge = "积分充值"
        
        var id: String { rawValue }
        
        var icon: String {
            switch self {
            case .home: return "house"
            case .profile: return "person"
            case .balanceRecords: return "wallet"
            case .scoreRecords: return "gift"
            case .balanceRecharge: return "creditcard"
            case .scoreRecharge: return "dollarsign.circle"
            }
        }
    }
    
    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            List(SidebarItem.allCases, selection: $selectedItem) { item in
                Label(item.rawValue, systemImage: item.icon)
                    .tag(item)
            }
            .navigationTitle("会员中心")
            #if os(macOS)
            .frame(minWidth: 200)
            #endif
        } detail: {
            NavigationStack {
                detailView(for: selectedItem)
            }
        }
    }
    
    @ViewBuilder
    private func detailView(for item: SidebarItem?) -> some View {
        switch item {
        case .home:
            MemberHomeView()
                .navigationTitle("会员首页")
        case .profile:
            ProfileView()
                .navigationTitle("个人信息")
        case .balanceRecords:
            BalanceRecordsView()
                .navigationTitle("余额记录")
        case .scoreRecords:
            ScoreRecordsView()
                .navigationTitle("积分记录")
        case .balanceRecharge:
            BalanceRechargeView()
                .navigationTitle("余额充值")
        case .scoreRecharge:
            ScoreRechargeView()
                .navigationTitle("积分充值")
        case .none:
            Text("请选择一项")
                .foregroundStyle(.secondary)
        }
    }
}
