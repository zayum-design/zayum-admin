import Foundation

struct ScoreRecord: Codable, Identifiable, Equatable {
    let id: Int
    let userId: Int
    let score: Double
    let beforeScore: Double
    let afterScore: Double
    let type: ScoreRecordType
    let remark: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case score
        case beforeScore
        case afterScore
        case type
        case remark
        case createdAt
    }
}

enum ScoreRecordType: String, Codable, CaseIterable {
    case recharge = "recharge"
    case consume = "consume"
    case earn = "earn"
    case adjust = "adjust"
    case adminAdd = "admin_add"
    case adminDeduct = "admin_deduct"
    case adminUpdate = "admin_update"
    case adminRecharge = "admin_recharge"
    case adminAdjust = "admin_adjust"
    
    var displayName: String {
        switch self {
        case .recharge: return "充值"
        case .consume: return "消费"
        case .earn: return "赚取"
        case .adjust: return "调整"
        case .adminAdd: return "管理员增加"
        case .adminDeduct: return "管理员扣除"
        case .adminUpdate: return "管理员更新"
        case .adminRecharge: return "管理员充值"
        case .adminAdjust: return "管理员调整"
        }
    }
    
    var isPositive: Bool {
        switch self {
        case .recharge, .earn, .adminAdd, .adminRecharge:
            return true
        case .consume, .adjust, .adminDeduct, .adminUpdate, .adminAdjust:
            return false
        }
    }
}

// MARK: - Request Models

struct RechargeScoreRequest: Codable {
    let score: Int
    let remark: String?
}
