//
//  LoginView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct LoginView: View {
    @State private var phone: String = ""
    @State private var password: String = ""
    @State private var code: String = ""
    @State private var loginType: LoginType = .password
    @State private var countdown: Int = 0
    @State private var isCountingDown: Bool = false
    
    @State private var authStore = AuthStore.shared
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var showError: Bool = false
    
    var isSheet: Bool = false
    
    @Environment(\.dismiss) private var dismiss
    
    enum LoginType: String, CaseIterable {
        case password = "密码登录"
        case sms = "验证码登录"
    }
    
    private var isPhoneValid: Bool {
        let phoneRegex = "^1[3-9]\\d{9}$"
        let predicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        return predicate.evaluate(with: phone)
    }
    
    private var isFormValid: Bool {
        guard isPhoneValid else { return false }
        
        switch loginType {
        case .password:
            return password.count >= 6
        case .sms:
            return code.count == 6
        }
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 渐变背景
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack {
                        Spacer(minLength: geometry.size.height * 0.1)
                        
                        // 白色卡片
                        VStack(spacing: 24) {
                            // 标题
                            VStack(spacing: 8) {
                                Text("会员登录")
                                    .font(.largeTitle)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.primary)
                                Text("欢迎回来，请登录您的账户")
                                    .foregroundStyle(.secondary)
                            }
                            
                            // 登录方式切换
                            Picker("登录方式", selection: $loginType) {
                                ForEach(LoginType.allCases, id: \.self) { type in
                                    Text(type.rawValue).tag(type)
                                }
                            }
                            .pickerStyle(.segmented)
                            .onChange(of: loginType) { _, _ in
                                // 切换登录方式时清除错误信息
                                errorMessage = nil
                                showError = false
                            }
                            
                            // 手机号输入
                            VStack(alignment: .leading, spacing: 4) {
                                TextField("请输入手机号", text: $phone)
                                    .textFieldStyle(.roundedBorder)
                                    .keyboardType(.phonePad)
                                    .textContentType(.telephoneNumber)
                                    .onChange(of: phone) { _, _ in
                                        // 限制手机号长度
                                        if phone.count > 11 {
                                            phone = String(phone.prefix(11))
                                        }
                                    }
                                
                                if !phone.isEmpty && !isPhoneValid {
                                    Text("请输入正确的手机号")
                                        .font(.caption)
                                        .foregroundStyle(.red)
                                }
                            }
                            
                            // 根据登录方式显示不同输入
                            if loginType == .password {
                                VStack(alignment: .leading, spacing: 4) {
                                    SecureField("请输入密码", text: $password)
                                        .textFieldStyle(.roundedBorder)
                                    
                                    if !password.isEmpty && password.count < 6 {
                                        Text("密码长度至少6位")
                                            .font(.caption)
                                            .foregroundStyle(.red)
                                    }
                                }
                            } else {
                                HStack(spacing: 12) {
                                    TextField("请输入验证码", text: $code)
                                        .textFieldStyle(.roundedBorder)
                                        .keyboardType(.numberPad)
                                        .onChange(of: code) { _, _ in
                                            // 限制验证码长度
                                            if code.count > 6 {
                                                code = String(code.prefix(6))
                                            }
                                        }
                                    
                                    Button(action: sendCode) {
                                        Text(countdown > 0 ? "\(countdown)s" : "获取验证码")
                                            .font(.subheadline)
                                            .frame(minWidth: 100)
                                    }
                                    .disabled(countdown > 0 || !isPhoneValid || isLoading)
                                    .buttonStyle(.bordered)
                                    .tint(.blue)
                                }
                            }
                            
                            // 错误提示
                            if showError, let error = errorMessage {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                    Text(error)
                                }
                                .foregroundStyle(.red)
                                .font(.caption)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            
                            // 登录按钮
                            Button(action: login) {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("登录")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isFormValid ? Color.blue : Color.gray)
                            .foregroundStyle(.white)
                            .cornerRadius(10)
                            .disabled(!isFormValid || isLoading)
                            
                            // 注册链接
                            HStack {
                                Text("还没有账户？")
                                    .foregroundStyle(.secondary)
                                NavigationLink("立即注册") {
                                    RegisterView()
                                }
                                .fontWeight(.medium)
                            }
                            .font(.subheadline)
                            
                            // 测试账号
                            Button(action: fillTestAccount) {
                                HStack(spacing: 4) {
                                    Image(systemName: "wand.and.stars")
                                        .font(.caption)
                                    Text("测试账号：138001380011 / 12345678")
                                        .font(.caption)
                                }
                                .foregroundStyle(.blue.opacity(0.8))
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 8)
                        }
                        .padding(32)
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(radius: 10)
                        .padding(.horizontal, 24)
                        
                        Spacer(minLength: geometry.size.height * 0.1)
                    }
                    .frame(minHeight: geometry.size.height)
                }
                .scrollDismissesKeyboard(.immediately)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isSheet {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func login() {
        guard isFormValid else { return }
        
        isLoading = true
        errorMessage = nil
        showError = false
        
        Task {
            switch loginType {
            case .password:
                await authStore.loginByPassword(phone: phone, password: password)
            case .sms:
                await authStore.loginBySms(phone: phone, code: code)
            }
            await MainActor.run {
                isLoading = false
                if authStore.errorMessage != nil {
                    errorMessage = authStore.errorMessage
                    showError = true
                } else if authStore.isAuthenticated {
                    // 登录成功，关闭 sheet
                    if isSheet {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func sendCode() {
        guard isPhoneValid, !isCountingDown else { return }
        
        isLoading = true
        errorMessage = nil
        showError = false
        
        Task {
            await authStore.sendSmsCode(phone: phone, type: .login)
            await MainActor.run {
                isLoading = false
                if authStore.errorMessage != nil {
                    errorMessage = authStore.errorMessage
                    showError = true
                } else {
                    startCountdown()
                }
            }
        }
    }
    
    private func startCountdown() {
        countdown = 60
        isCountingDown = true
        
        Task {
            while countdown > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await MainActor.run {
                    countdown -= 1
                }
            }
            await MainActor.run {
                isCountingDown = false
            }
        }
    }
    
    private func fillTestAccount() {
        phone = "138001380011"
        password = "12345678"
        loginType = .password
    }
}

// MARK: - Preview

#Preview("iPhone") {
    NavigationStack {
        LoginView()
    }
}

#Preview("iPad", traits: .fixedLayout(width: 1024, height: 768)) {
    NavigationStack {
        LoginView()
    }
}
