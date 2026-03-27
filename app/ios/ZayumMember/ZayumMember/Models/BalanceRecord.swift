import Foundation

struct BalanceRecord: Codable, Identifiable, Equatable {
    let id: Int
    let userId: Int
    let amount: Double
    let beforeBalance: Double
    let afterBalance: Double
    let type: BalanceRecordType
    let remark: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case amount
        case beforeBalance = "before_balance"
        case afterBalance = "after_balance"
        case type
        case remark
        case createdAt = "created_at"
    }
}

enum BalanceRecordType: String, Codable, CaseIterable {
    case recharge = "recharge"
    case consume = "consume"
    case refund = "refund"
    case adjust = "adjust"
    
    var displayName: String {
        switch self {
        case .recharge: return "充值"
        case .consume: return "消费"
        case .refund: return "退款"
        case .adjust: return "调整"
        }
    }
    
    var isPositive: Bool {
        switch self {
        case .recharge, .refund:
            return true
        case .consume, .adjust:
            return false
        }
    }
}

// MARK: - Request Models

struct RechargeBalanceRequest: Codable {
    let amount: Double
    let remark: String?
}
