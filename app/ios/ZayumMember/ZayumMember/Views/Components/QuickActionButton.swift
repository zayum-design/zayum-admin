//
//  QuickActionButton.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct QuickAction: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let color: Color
    let path: String
}

struct QuickActionButton: View {
    let action: QuickAction
    let onTap: (() -> Void)?
    
    init(action: QuickAction, onTap: (() -> Void)? = nil) {
        self.action = action
        self.onTap = onTap
    }
    
    var body: some View {
        Button {
            if let onTap = onTap {
                onTap()
            } else {
                // 导航到对应页面
                NavigationManager.shared.navigate(to: action.path)
            }
        } label: {
            VStack(spacing: 12) {
                // 图标
                Image(systemName: action.icon)
                    .font(.system(size: 24))
                    .foregroundStyle(action.color)
                    .frame(width: 48, height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(action.color.opacity(0.15))
                    )
                
                // 标题
                Text(action.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Navigation Manager (简化版)

class NavigationManager: ObservableObject {
    static let shared = NavigationManager()
    
    @Published var currentPath: String?
    
    func navigate(to path: String) {
        currentPath = path
        // 实际项目中这里会处理导航逻辑
        print("Navigate to: \(path)")
    }
    
    func goBack() {
        currentPath = nil
    }
}

// MARK: - Preview

#Preview {
    let sampleAction = QuickAction(
        title: "余额充值",
        icon: "wallet",
        color: .blue,
        path: "/recharge/balance"
    )
    
    QuickActionButton(action: sampleAction)
        .padding()
        .frame(width: 150)
        .background(Color(.systemGroupedBackground))
}
