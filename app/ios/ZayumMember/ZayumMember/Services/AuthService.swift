import Foundation

@Observable
class AuthService {
    static let shared = AuthService()
    
    private let apiClient = APIClient.shared
    private let tokenStorage = TokenStorage.shared
    
    private init() {}
    
    // MARK: - Login
    
    func loginByPassword(phone: String, password: String) async throws -> Member {
        let request = LoginByPasswordRequest(phone: phone, password: password)
        let response: LoginResponse = try await apiClient.post(
            path: APIEndpoints.login,
            body: request
        )
        
        tokenStorage.saveToken(response.token.accessToken)
        return response.user
    }
    
    func loginBySms(phone: String, code: String) async throws -> Member {
        let request = LoginBySmsRequest(phone: phone, code: code)
        let response: LoginResponse = try await apiClient.post(
            path: APIEndpoints.login,
            body: request
        )
        
        tokenStorage.saveToken(response.token.accessToken)
        return response.user
    }
    
    // MARK: - Register
    
    func registerByPassword(phone: String, password: String, confirmPassword: String) async throws -> Member {
        let request = RegisterByPasswordRequest(
            phone: phone,
            password: password,
            confirmPassword: confirmPassword
        )
        let response: LoginResponse = try await apiClient.post(
            path: APIEndpoints.register,
            body: request
        )
        
        tokenStorage.saveToken(response.token.accessToken)
        return response.user
    }
    
    func registerBySms(phone: String, code: String, password: String, confirmPassword: String) async throws -> Member {
        let request = RegisterBySmsRequest(
            phone: phone,
            code: code,
            password: password,
            confirmPassword: confirmPassword
        )
        let response: LoginResponse = try await apiClient.post(
            path: APIEndpoints.register,
            body: request
        )
        
        tokenStorage.saveToken(response.token.accessToken)
        return response.user
    }
    
    // MARK: - SMS Code
    
    func sendSmsCode(phone: String, type: SmsCodeType) async throws {
        let request = SmsCodeRequest(phone: phone, type: type)
        let _: EmptyData = try await apiClient.post(
            path: APIEndpoints.smsCode,
            body: request
        )
    }
    
    // MARK: - Logout
    
    func logout() async throws {
        do {
            let _: EmptyData = try await apiClient.post(path: APIEndpoints.logout)
        } catch {
            // 即使请求失败也清除本地 token
        }
        tokenStorage.clearToken()
    }
}
