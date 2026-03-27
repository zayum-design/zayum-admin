import Foundation

@Observable
class MemberService {
    static let shared = MemberService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Profile
    
    func getProfile() async throws -> Member {
        return try await apiClient.get(path: APIEndpoints.profile)
    }
    
    func updateProfile(nickname: String? = nil, 
                       avatar: String? = nil, 
                       email: String? = nil, 
                       gender: Gender? = nil, 
                       birthday: String? = nil) async throws -> Member {
        let request = UpdateProfileRequest(
            nickname: nickname,
            avatar: avatar,
            email: email,
            gender: gender,
            birthday: birthday
        )
        return try await apiClient.put(path: APIEndpoints.profile, body: request)
    }
    
    // MARK: - Balance Records
    
    func getBalanceRecords(page: Int = 1, pageSize: Int = 20) async throws -> [BalanceRecord] {
        let path = "\(APIEndpoints.balanceRecords)?page=\(page)&page_size=\(pageSize)"
        return try await apiClient.get(path: path)
    }
    
    // MARK: - Score Records
    
    func getScoreRecords(page: Int = 1, pageSize: Int = 20) async throws -> [ScoreRecord] {
        let path = "\(APIEndpoints.scoreRecords)?page=\(page)&page_size=\(pageSize)"
        return try await apiClient.get(path: path)
    }
}
