//
//  AuthStore.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import Foundation
import Observation

@Observable
class AuthStore {
    static let shared = AuthStore()
    
    var member: Member?
    var isAuthenticated: Bool = false
    var isLoading: Bool = false
    var errorMessage: String?
    var showLoginSheet: Bool = false
    
    private let authService = AuthService.shared
    
    private init() {
        self.isAuthenticated = TokenStorage.shared.isLoggedIn
    }
    
    // MARK: - 密码登录
    func loginByPassword(phone: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let member = try await authService.loginByPassword(phone: phone, password: password)
            self.member = member
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 验证码登录
    func loginBySms(phone: String, code: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let member = try await authService.loginBySms(phone: phone, code: code)
            self.member = member
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 密码注册
    func registerByPassword(phone: String, password: String, confirmPassword: String) async {
        isLoading = true
        errorMessage = nil
        
        // 验证密码是否一致
        guard password == confirmPassword else {
            errorMessage = "两次输入的密码不一致"
            isLoading = false
            return
        }
        
        do {
            let member = try await authService.registerByPassword(phone: phone, password: password, confirmPassword: confirmPassword)
            self.member = member
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 验证码注册
    func registerBySms(phone: String, code: String, password: String, confirmPassword: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let member = try await authService.registerBySms(phone: phone, code: code, password: password, confirmPassword: confirmPassword)
            self.member = member
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 发送验证码
    func sendSmsCode(phone: String, type: SmsCodeType) async {
        isLoading = true
        errorMessage = nil
        do {
            try await authService.sendSmsCode(phone: phone, type: type)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 登出
    func logout() async {
        isLoading = true
        errorMessage = nil
        do {
            try await authService.logout()
            // 清除本地存储
            TokenStorage.shared.clearToken()
            member = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 检查登录状态
    func checkAuth() {
        isAuthenticated = TokenStorage.shared.isLoggedIn
        if isAuthenticated, member == nil {
            // 如果已登录但成员信息为空，可以选择加载用户信息
            Task {
                await loadCurrentUser()
            }
        }
    }
    
    // MARK: - 显示登录 Sheet
    func presentLoginSheet() {
        showLoginSheet = true
    }
    
    // MARK: - 关闭登录 Sheet
    func dismissLoginSheet() {
        showLoginSheet = false
    }
    
    // MARK: - 加载当前用户信息
    private func loadCurrentUser() async {
        isLoading = true
        do {
            // 这里可以通过 MemberService 获取当前用户信息
            let member = try await MemberService.shared.getProfile()
            self.member = member
        } catch {
            // 如果获取用户信息失败，可能是token过期
            TokenStorage.shared.clearToken()
            isAuthenticated = false
            member = nil
        }
        isLoading = false
    }
}
