import Foundation
import Observation

@Observable
class TokenStorage {
    static let shared = TokenStorage()
    
    private let tokenKey = "com.zayum.token"
    private let userDefaults = UserDefaults.standard
    
    var token: String? {
        didSet {
            if let token = token {
                userDefaults.set(token, forKey: tokenKey)
            } else {
                userDefaults.removeObject(forKey: tokenKey)
            }
        }
    }
    
    var isLoggedIn: Bool {
        token != nil
    }
    
    private init() {
        self.token = userDefaults.string(forKey: tokenKey)
    }
    
    func saveToken(_ token: String) {
        self.token = token
    }
    
    func clearToken() {
        self.token = nil
    }
}
