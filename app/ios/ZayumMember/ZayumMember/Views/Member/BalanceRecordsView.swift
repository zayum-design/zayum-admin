//
//  BalanceRecordsView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct BalanceRecordsView: View {
    @State private var memberStore = MemberStore.shared
    @State private var selectedFilter: BalanceRecordType?
    
    var filteredRecords: [BalanceRecord] {
        if let filter = selectedFilter {
            return memberStore.balanceRecords.filter { $0.type == filter }
        }
        return memberStore.balanceRecords
    }
    
    var body: some View {
        List {
            // 统计卡片
            BalanceSummaryCard(records: memberStore.balanceRecords)
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)
                .padding(.bottom, 8)
            
            // 筛选器
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "全部",
                        isSelected: selectedFilter == nil
                    ) {
                        selectedFilter = nil
                    }
                    
                    ForEach(BalanceRecordType.allCases, id: \.self) { type in
                        FilterChip(
                            title: type.displayName,
                            isSelected: selectedFilter == type
                        ) {
                            selectedFilter = type
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
            
            // 记录列表
            if filteredRecords.isEmpty {
                Section {
                    EmptyBalanceRecordsView()
                }
            } else {
                Section {
                    ForEach(filteredRecords) { record in
                        BalanceRecordRow(record: record)
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("余额记录")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await memberStore.fetchBalanceRecords()
        }
        .task {
            if memberStore.balanceRecords.isEmpty {
                await memberStore.fetchBalanceRecords()
            }
        }
    }
}

// MARK: - Balance Summary Card

struct BalanceSummaryCard: View {
    let records: [BalanceRecord]
    
    private var totalIncome: Double {
        records
            .filter { $0.type.isPositive }
            .reduce(0) { $0 + $1.amount }
    }
    
    private var totalExpense: Double {
        records
            .filter { !$0.type.isPositive }
            .reduce(0) { $0 + $1.amount }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text("余额变动统计")
                .font(.headline)
                .foregroundStyle(.primary)
            
            HStack(spacing: 0) {
                // 收入
                VStack(spacing: 4) {
                    Text("累计收入")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(String(format: "+%.2f", totalIncome))
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.green)
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .frame(height: 40)
                
                // 支出
                VStack(spacing: 4) {
                    Text("累计支出")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(String(format: "-%.2f", totalExpense))
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.red)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 4)
        )
        .padding(.horizontal)
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.blue : Color(.systemGray5))
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Empty State

struct EmptyBalanceRecordsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            
            Text("暂无余额记录")
                .font(.headline)
                .foregroundStyle(.primary)
            
            Text("您的余额变动记录将显示在这里")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .padding()
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        BalanceRecordsView()
    }
}
