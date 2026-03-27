import Foundation

struct ScoreRecord: Codable, Identifiable, Equatable {
    let id: Int
    let userId: Int
    let score: Int
    let beforeScore: Int
    let afterScore: Int
    let type: ScoreRecordType
    let remark: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case score
        case beforeScore = "before_score"
        case afterScore = "after_score"
        case type
        case remark
        case createdAt = "created_at"
    }
}

enum ScoreRecordType: String, Codable, CaseIterable {
    case recharge = "recharge"
    case consume = "consume"
    case earn = "earn"
    case adjust = "adjust"
    
    var displayName: String {
        switch self {
        case .recharge: return "充值"
        case .consume: return "消费"
        case .earn: return "赚取"
        case .adjust: return "调整"
        }
    }
    
    var isPositive: Bool {
        switch self {
        case .recharge, .earn:
            return true
        case .consume, .adjust:
            return false
        }
    }
}

// MARK: - Request Models

struct RechargeScoreRequest: Codable {
    let score: Int
    let remark: String?
}
