//
//  RecordRow.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

// MARK: - Balance Record Row

struct BalanceRecordRow: View {
    let record: BalanceRecord
    
    var body: some View {
        HStack(spacing: 12) {
            // 类型图标
            typeIcon
            
            // 信息
            VStack(alignment: .leading, spacing: 4) {
                Text(record.type.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                
                if let remark = record.remark, !remark.isEmpty {
                    Text(remark)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                
                Text(formattedDate(record.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // 金额
            Text(formattedAmount(record.amount))
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(amountColor)
        }
        .padding(.vertical, 8)
    }
    
    private var typeIcon: some View {
        let iconName: String
        let color: Color
        
        switch record.type {
        case .recharge:
            iconName = "plus.circle.fill"
            color = .green
        case .consume:
            iconName = "minus.circle.fill"
            color = .red
        case .refund:
            iconName = "arrow.uturn.backward.circle.fill"
            color = .blue
        case .adjust:
            iconName = "slider.horizontal.below.rectangle"
            color = .orange
        }
        
        return Image(systemName: iconName)
            .font(.title2)
            .foregroundStyle(color)
    }
    
    private var amountColor: Color {
        record.type.isPositive ? .green : .red
    }
    
    private func formattedAmount(_ amount: Double) -> String {
        let prefix = record.type.isPositive ? "+" : "-"
        return "\(prefix)¥\(String(format: "%.2f", abs(amount)))"
    }
    
    private func formattedDate(_ dateString: String) -> String {
        // 尝试解析 ISO 8601 格式
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM-dd HH:mm"
            return displayFormatter.string(from: date)
        }
        
        // 尝试解析普通格式
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = dateFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM-dd HH:mm"
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

// MARK: - Score Record Row

struct ScoreRecordRow: View {
    let record: ScoreRecord
    
    var body: some View {
        HStack(spacing: 12) {
            // 类型图标
            typeIcon
            
            // 信息
            VStack(alignment: .leading, spacing: 4) {
                Text(record.type.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                
                if let remark = record.remark, !remark.isEmpty {
                    Text(remark)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                
                Text(formattedDate(record.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // 积分
            Text(formattedScore(record.score))
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(scoreColor)
        }
        .padding(.vertical, 8)
    }
    
    private var typeIcon: some View {
        let iconName: String
        let color: Color
        
        switch record.type {
        case .recharge:
            iconName = "plus.circle.fill"
            color = .green
        case .consume:
            iconName = "minus.circle.fill"
            color = .red
        case .earn:
            iconName = "star.circle.fill"
            color = .orange
        case .adjust:
            iconName = "slider.horizontal.below.rectangle"
            color = .purple
        }
        
        return Image(systemName: iconName)
            .font(.title2)
            .foregroundStyle(color)
    }
    
    private var scoreColor: Color {
        record.type.isPositive ? .green : .red
    }
    
    private func formattedScore(_ score: Int) -> String {
        let prefix = record.type.isPositive ? "+" : "-"
        return "\(prefix)\(abs(score)) 积分"
    }
    
    private func formattedDate(_ dateString: String) -> String {
        // 尝试解析 ISO 8601 格式
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM-dd HH:mm"
            return displayFormatter.string(from: date)
        }
        
        // 尝试解析普通格式
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = dateFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM-dd HH:mm"
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

// MARK: - Preview

#Preview("Balance Record") {
    let sampleBalanceRecord = BalanceRecord(
        id: 1,
        userId: 1,
        amount: 100.00,
        beforeBalance: 50.00,
        afterBalance: 150.00,
        type: .recharge,
        remark: "充值成功",
        createdAt: "2024-03-27 10:30:00"
    )
    
    BalanceRecordRow(record: sampleBalanceRecord)
        .padding()
}

#Preview("Score Record") {
    let sampleScoreRecord = ScoreRecord(
        id: 1,
        userId: 1,
        score: 50,
        beforeScore: 100,
        afterScore: 150,
        type: .earn,
        remark: "签到奖励",
        createdAt: "2024-03-27 10:30:00"
    )
    
    ScoreRecordRow(record: sampleScoreRecord)
        .padding()
}
