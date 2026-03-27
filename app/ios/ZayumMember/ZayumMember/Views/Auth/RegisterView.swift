//
//  RegisterView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct RegisterView: View {
    @State private var phone: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var code: String = ""
    @State private var registerType: RegisterType = .password
    @State private var countdown: Int = 0
    @State private var isCountingDown: Bool = false
    
    @State private var authStore = AuthStore.shared
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var showError: Bool = false
    @State private var registrationSuccess: Bool = false
    
    @Environment(\.dismiss) private var dismiss
    
    enum RegisterType: String, CaseIterable {
        case password = "密码注册"
        case sms = "验证码注册"
    }
    
    private var isPhoneValid: Bool {
        let phoneRegex = "^1[3-9]\\d{9}$"
        let predicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        return predicate.evaluate(with: phone)
    }
    
    private var isPasswordValid: Bool {
        password.count >= 6
    }
    
    private var isConfirmPasswordValid: Bool {
        !confirmPassword.isEmpty && password == confirmPassword
    }
    
    private var isFormValid: Bool {
        guard isPhoneValid else { return false }
        
        switch registerType {
        case .password:
            return isPasswordValid && isConfirmPasswordValid
        case .sms:
            return code.count == 6 && isPasswordValid && isConfirmPasswordValid
        }
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 渐变背景
                LinearGradient(
                    colors: [.purple, .blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack {
                        Spacer(minLength: geometry.size.height * 0.05)
                        
                        // 白色卡片
                        VStack(spacing: 20) {
                            // 标题
                            VStack(spacing: 8) {
                                Text("注册账户")
                                    .font(.largeTitle)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.primary)
                                Text("创建您的新账户")
                                    .foregroundStyle(.secondary)
                            }
                            
                            // 注册方式切换
                            Picker("注册方式", selection: $registerType) {
                                ForEach(RegisterType.allCases, id: \.self) { type in
                                    Text(type.rawValue).tag(type)
                                }
                            }
                            .pickerStyle(.segmented)
                            .onChange(of: registerType) { _, _ in
                                // 切换注册方式时清除错误信息
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
                            
                            // 验证码注册时显示验证码输入
                            if registerType == .sms {
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
                                    .tint(.purple)
                                }
                            }
                            
                            // 密码输入
                            VStack(alignment: .leading, spacing: 4) {
                                SecureField("请输入密码", text: $password)
                                    .textFieldStyle(.roundedBorder)
                                
                                if !password.isEmpty && !isPasswordValid {
                                    Text("密码长度至少6位")
                                        .font(.caption)
                                        .foregroundStyle(.red)
                                }
                            }
                            
                            // 确认密码
                            VStack(alignment: .leading, spacing: 4) {
                                SecureField("请再次输入密码", text: $confirmPassword)
                                    .textFieldStyle(.roundedBorder)
                                
                                if !confirmPassword.isEmpty && !isConfirmPasswordValid {
                                    Text(password != confirmPassword ? "两次输入的密码不一致" : "")
                                        .font(.caption)
                                        .foregroundStyle(.red)
                                }
                            }
                            
                            // 密码提示
                            if registerType == .sms {
                                Text("使用验证码注册时，初始密码将设置为输入的密码")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
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
                            
                            // 注册按钮
                            Button(action: register) {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("注册")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isFormValid ? Color.purple : Color.gray)
                            .foregroundStyle(.white)
                            .cornerRadius(10)
                            .disabled(!isFormValid || isLoading)
                            
                            // 返回登录链接
                            HStack {
                                Text("已有账户？")
                                    .foregroundStyle(.secondary)
                                Button("返回登录") {
                                    dismiss()
                                }
                                .fontWeight(.medium)
                            }
                            .font(.subheadline)
                        }
                        .padding(32)
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(radius: 10)
                        .padding(.horizontal, 24)
                        
                        Spacer(minLength: geometry.size.height * 0.05)
                    }
                    .frame(minHeight: geometry.size.height)
                }
                .scrollDismissesKeyboard(.immediately)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("注册成功", isPresented: $registrationSuccess) {
            Button("确定") {
                dismiss()
            }
        } message: {
            Text("您的账户已成功创建，请登录。")
        }
    }
    
    private func register() {
        guard isFormValid else { return }
        
        isLoading = true
        errorMessage = nil
        showError = false
        
        Task {
            switch registerType {
            case .password:
                await authStore.registerByPassword(phone: phone, password: password, confirmPassword: confirmPassword)
            case .sms:
                await authStore.registerBySms(phone: phone, code: code, password: password, confirmPassword: confirmPassword)
            }
            await MainActor.run {
                isLoading = false
                if authStore.errorMessage != nil {
                    errorMessage = authStore.errorMessage
                    showError = true
                } else {
                    registrationSuccess = true
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
            await authStore.sendSmsCode(phone: phone, type: .register)
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
}

// MARK: - Preview

#Preview("iPhone") {
    NavigationStack {
        RegisterView()
    }
}

#Preview("iPad", traits: .fixedLayout(width: 1024, height: 768)) {
    NavigationStack {
        RegisterView()
    }
}
