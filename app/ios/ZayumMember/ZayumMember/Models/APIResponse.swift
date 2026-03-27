import Foundation

// MARK: - Payment Method Enum
enum PaymentMethod: String, CaseIterable {
    case alipay = "支付宝"
    case wechat = "微信支付"
}

// MARK: - API Response

struct APIResponse<T: Codable>: Codable {
    let code: Int
    let message: String?
    let data: T?
}

struct LoginResponse: Codable {
    let user: Member
    let token: TokenInfo
}

struct TokenInfo: Codable {
    let accessToken: String
    let tokenType: String
    let expiresIn: Int
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
    }
}
