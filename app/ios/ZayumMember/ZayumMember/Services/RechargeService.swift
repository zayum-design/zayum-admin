import Foundation

@Observable
class RechargeService {
    static let shared = RechargeService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Balance Recharge
    
    func rechargeBalance(amount: Double, remark: String? = nil) async throws -> BalanceRecord {
        let request = RechargeBalanceRequest(amount: amount, remark: remark)
        return try await apiClient.post(
            path: APIEndpoints.rechargeBalance,
            body: request
        )
    }
    
    // MARK: - Score Recharge
    
    func rechargeScore(score: Int, remark: String? = nil) async throws -> ScoreRecord {
        let request = RechargeScoreRequest(score: score, remark: remark)
        return try await apiClient.post(
            path: APIEndpoints.rechargeScore,
            body: request
        )
    }
}
