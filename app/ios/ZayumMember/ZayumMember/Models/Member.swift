import Foundation

struct Member: Codable, Identifiable, Equatable {
    let id: Int
    let username: String
    let nickname: String?
    let avatar: String?
    let email: String?
    let mobile: String?
    let gender: Gender?
    let birthday: String?
    let status: MemberStatus
    let score: Int
    let balance: Double
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case nickname
        case avatar
        case email
        case mobile
        case gender
        case birthday
        case status
        case score
        case balance
        case createdAt
        case updatedAt
    }
    
    // 成员初始化器（用于 Preview 等场景）
    init(id: Int, username: String, nickname: String?, avatar: String?, email: String?, mobile: String?, gender: Gender?, birthday: String?, status: MemberStatus, score: Int, balance: Double, createdAt: String, updatedAt: String) {
        self.id = id
        self.username = username
        self.nickname = nickname
        self.avatar = avatar
        self.email = email
        self.mobile = mobile
        self.gender = gender
        self.birthday = birthday
        self.status = status
        self.score = score
        self.balance = balance
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // 自定义解码，处理 id 可能是字符串的情况
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // 处理 id：可能是 Int 或 String
        if let intId = try? container.decode(Int.self, forKey: .id) {
            id = intId
        } else if let stringId = try? container.decode(String.self, forKey: .id) {
            id = Int(stringId) ?? 0
        } else {
            id = 0
        }
        
        username = try container.decode(String.self, forKey: .username)
        nickname = try container.decodeIfPresent(String.self, forKey: .nickname)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        mobile = try container.decodeIfPresent(String.self, forKey: .mobile)
        gender = try container.decodeIfPresent(Gender.self, forKey: .gender)
        birthday = try container.decodeIfPresent(String.self, forKey: .birthday)
        status = try container.decode(MemberStatus.self, forKey: .status)
        score = try container.decode(Int.self, forKey: .score)
        
        // 处理 balance：可能是 Double 或 String
        if let doubleBalance = try? container.decode(Double.self, forKey: .balance) {
            balance = doubleBalance
        } else if let stringBalance = try? container.decode(String.self, forKey: .balance) {
            balance = Double(stringBalance) ?? 0.0
        } else {
            balance = 0.0
        }
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
}

enum Gender: String, Codable, CaseIterable {
    case unknown = "unknown"
    case male = "male"
    case female = "female"
    
    var displayName: String {
        switch self {
        case .unknown: return "保密"
        case .male: return "男"
        case .female: return "女"
        }
    }
}

enum MemberStatus: String, Codable {
    case normal = "normal"
    case active = "active"
    case inactive = "inactive"
    case banned = "banned"
    
    var displayName: String {
        switch self {
        case .normal: return "正常"
        case .active: return "正常"
        case .inactive: return "未激活"
        case .banned: return "已封禁"
        }
    }
}

// MARK: - Request Models

struct LoginByPasswordRequest: Codable {
    let phone: String
    let password: String
    let loginType: String = "password"
}

struct LoginBySmsRequest: Codable {
    let phone: String
    let code: String
    let loginType: String = "sms"
}

struct RegisterByPasswordRequest: Codable {
    let phone: String
    let password: String
    let confirmPassword: String
    let registerType: String = "password"
    
    enum CodingKeys: String, CodingKey {
        case phone
        case password
        case confirmPassword = "confirm_password"
        case registerType = "register_type"
    }
}

struct RegisterBySmsRequest: Codable {
    let phone: String
    let code: String
    let password: String
    let confirmPassword: String
    let registerType: String = "sms"
    
    enum CodingKeys: String, CodingKey {
        case phone
        case code
        case password
        case confirmPassword = "confirm_password"
        case registerType = "register_type"
    }
}

struct SmsCodeRequest: Codable {
    let phone: String
    let type: SmsCodeType
}

enum SmsCodeType: String, Codable {
    case login = "login"
    case register = "register"
    case resetPassword = "reset_password"
}

struct UpdateProfileRequest: Codable {
    let nickname: String?
    let avatar: String?
    let email: String?
    let gender: Gender?
    let birthday: String?
}
