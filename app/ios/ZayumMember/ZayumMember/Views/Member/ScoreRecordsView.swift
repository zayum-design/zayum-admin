//
//  ScoreRecordsView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct ScoreRecordsView: View {
    @State private var memberStore = MemberStore.shared
    @State private var selectedFilter: ScoreRecordType?
    
    var filteredRecords: [ScoreRecord] {
        if let filter = selectedFilter {
            return memberStore.scoreRecords.filter { $0.type == filter }
        }
        return memberStore.scoreRecords
    }
    
    var body: some View {
        List {
            // 统计卡片
            ScoreSummaryCard(records: memberStore.scoreRecords)
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
                    
                    ForEach(ScoreRecordType.allCases, id: \.self) { type in
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
                    EmptyScoreRecordsView()
                }
            } else {
                Section {
                    ForEach(filteredRecords) { record in
                        ScoreRecordRow(record: record)
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("积分记录")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await memberStore.fetchScoreRecords()
        }
        .task {
            if memberStore.scoreRecords.isEmpty {
                await memberStore.fetchScoreRecords()
            }
        }
    }
}

// MARK: - Score Summary Card

struct ScoreSummaryCard: View {
    let records: [ScoreRecord]
    
    private var totalEarned: Int {
        records
            .filter { $0.type.isPositive }
            .reduce(0) { $0 + $1.score }
    }
    
    private var totalUsed: Int {
        records
            .filter { !$0.type.isPositive }
            .reduce(0) { $0 + $1.score }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text("积分变动统计")
                .font(.headline)
                .foregroundStyle(.primary)
            
            HStack(spacing: 0) {
                // 获得
                VStack(spacing: 4) {
                    Text("累计获得")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("+\(totalEarned)")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.green)
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .frame(height: 40)
                
                // 使用
                VStack(spacing: 4) {
                    Text("累计使用")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("-\(totalUsed)")
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

// MARK: - Empty State

struct EmptyScoreRecordsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "star.slash")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            
            Text("暂无积分记录")
                .font(.headline)
                .foregroundStyle(.primary)
            
            Text("您的积分变动记录将显示在这里")
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
        ScoreRecordsView()
    }
}
