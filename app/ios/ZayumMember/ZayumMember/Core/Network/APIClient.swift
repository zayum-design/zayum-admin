import Foundation

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case unauthorized
    case networkError(Error)
    case unknown
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "无效的URL"
        case .invalidResponse:
            return "无效的响应"
        case .httpError(let statusCode, let message):
            return message ?? "HTTP错误: \(statusCode)"
        case .decodingError:
            return "数据解析失败"
        case .unauthorized:
            return "登录已过期，请重新登录"
        case .networkError:
            return "网络连接失败"
        case .unknown:
            return "未知错误"
        }
    }
}

@Observable
class APIClient {
    static let shared = APIClient()
    
    private let session: URLSession
    private let tokenStorage: TokenStorage
    
    private init() {
        self.tokenStorage = TokenStorage.shared
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    // MARK: - Request Methods
    
    func get<T: Codable>(path: String) async throws -> T {
        return try await request(method: "GET", path: path, body: nil)
    }
    
    func post<T: Codable>(path: String, body: Encodable? = nil) async throws -> T {
        return try await request(method: "POST", path: path, body: body)
    }
    
    func put<T: Codable>(path: String, body: Encodable? = nil) async throws -> T {
        return try await request(method: "PUT", path: path, body: body)
    }
    
    func patch<T: Codable>(path: String, body: Encodable? = nil) async throws -> T {
        return try await request(method: "PATCH", path: path, body: body)
    }
    
    func delete<T: Codable>(path: String) async throws -> T {
        return try await request(method: "DELETE", path: path, body: nil)
    }
    
    // MARK: - Private Methods
    
    private func request<T: Codable>(method: String, path: String, body: Encodable?) async throws -> T {
        let fullURL = APIEndpoints.baseURL + path
        guard let url = URL(string: fullURL) else {
            print("[API] ❌ 无效 URL: \(fullURL)")
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // 添加 Authorization Header
        if let token = tokenStorage.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // 添加请求体
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.keyEncodingStrategy = .useDefaultKeys
                request.httpBody = try encoder.encode(body)
                if let bodyString = String(data: request.httpBody!, encoding: .utf8) {
                    print("[API] 📤 请求体: \(bodyString)")
                }
            } catch {
                print("[API] ❌ 请求体编码失败: \(error)")
                throw APIError.decodingError(error)
            }
        }
        
        print("[API] 🚀 \(method) \(fullURL)")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("[API] ❌ 无效响应")
                throw APIError.invalidResponse
            }
            
            print("[API] 📥 状态码: \(httpResponse.statusCode)")
            
            if let responseString = String(data: data, encoding: .utf8) {
                print("[API] 📥 响应: \(responseString)")
            }
            
            // 处理 401 错误
            if httpResponse.statusCode == 401 {
                tokenStorage.clearToken()
                throw APIError.unauthorized
            }
            
            // 检查 HTTP 状态码
            guard (200...299).contains(httpResponse.statusCode) else {
                let errorResponse = try? JSONDecoder().decode(APIResponse<EmptyData>.self, from: data)
                let errorMessage = errorResponse?.message ?? "HTTP错误: \(httpResponse.statusCode)"
                print("[API] ❌ HTTP错误: \(httpResponse.statusCode), 消息: \(errorMessage)")
                throw APIError.httpError(
                    statusCode: httpResponse.statusCode,
                    message: errorResponse?.message
                )
            }
            
            // 解析响应数据
            do {
                let apiResponse = try JSONDecoder().decode(APIResponse<T>.self, from: data)
                
                guard apiResponse.code == 200 else {
                    print("[API] ❌ 业务错误: code=\(apiResponse.code), message=\(apiResponse.message ?? "nil")")
                    throw APIError.httpError(
                        statusCode: apiResponse.code,
                        message: apiResponse.message
                    )
                }
                
                guard let responseData = apiResponse.data else {
                    throw APIError.invalidResponse
                }
                
                print("[API] ✅ 请求成功")
                return responseData
            } catch {
                print("[API] ❌ 解析失败: \(error)")
                throw APIError.decodingError(error)
            }
            
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] ❌ 网络错误: \(error)")
            print("[API] ❌ 错误详情: \(error.localizedDescription)")
            throw APIError.networkError(error)
        }
    }
}

// 用于空响应的占位类型
struct EmptyData: Codable {}
