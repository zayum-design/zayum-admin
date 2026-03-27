//
//  ProfileView.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import SwiftUI

struct ProfileView: View {
    @State private var memberStore = MemberStore.shared
    @State private var nickname: String = ""
    @State private var selectedGender: Gender = .unknown
    @State private var birthday: Date = Date()
    @State private var showSaveSuccess = false
    @Environment(\.dismiss) private var dismiss
    
    private var profile: Member? {
        memberStore.profile
    }
    
    private var isFormValid: Bool {
        !nickname.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    var body: some View {
        Form {
            // 头像区域
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        AvatarView(avatar: profile?.avatar, size: 80)
                        
                        Button("更换头像") {
                            // 实现更换头像功能
                        }
                        .font(.caption)
                        .foregroundStyle(.blue)
                    }
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            .listRowBackground(Color.clear)
            
            // 基本信息
            Section("基本信息") {
                // 昵称
                HStack {
                    Text("昵称")
                        .foregroundStyle(.primary)
                    TextField("请输入昵称", text: $nickname)
                        .multilineTextAlignment(.trailing)
                }
                
                // 手机号 (只读)
                HStack {
                    Text("手机号")
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(profile?.mobile ?? "未绑定")
                        .foregroundStyle(.secondary)
                }
                
                // 邮箱 (只读)
                HStack {
                    Text("邮箱")
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(profile?.email ?? "未设置")
                        .foregroundStyle(.secondary)
                }
            }
            
            // 个人资料
            Section("个人资料") {
                // 性别
                Picker("性别", selection: $selectedGender) {
                    ForEach(Gender.allCases, id: \.self) { gender in
                        Text(gender.displayName).tag(gender)
                    }
                }
                
                // 生日
                DatePicker("生日",
                           selection: $birthday,
                           displayedComponents: .date)
            }
            
            // 账户信息
            Section("账户信息") {
                HStack {
                    Text("用户名")
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(profile?.username ?? "")
                        .foregroundStyle(.secondary)
                }
                
                HStack {
                    Text("账户状态")
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(profile?.status.displayName ?? "未知")
                        .foregroundStyle(.secondary)
                }
                
                HStack {
                    Text("注册时间")
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(profile?.createdAt ?? "")
                        .foregroundStyle(.secondary)
                }
            }
            
            // 保存按钮
            Section {
                Button {
                    saveProfile()
                } label: {
                    HStack {
                        Spacer()
                        if memberStore.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("保存")
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                }
                .disabled(!isFormValid || memberStore.isLoading)
                .listRowBackground(
                    isFormValid ? Color.blue : Color.gray
                )
                .foregroundStyle(.white)
            }
        }
        .navigationTitle("个人信息")
        .navigationBarTitleDisplayMode(.inline)
        .alert("保存成功", isPresented: $showSaveSuccess) {
            Button("确定") {
                dismiss()
            }
        } message: {
            Text("您的个人信息已更新")
        }
        .onAppear {
            loadProfileData()
        }
    }
    
    private func loadProfileData() {
        if let profile = profile {
            nickname = profile.nickname ?? profile.username
            selectedGender = profile.gender ?? .unknown
            if let birthdayString = profile.birthday {
                birthday = parseDate(birthdayString) ?? Date()
            }
        }
    }
    
    private func saveProfile() {
        Task {
            let birthdayString = formatDate(birthday)
            let genderString = selectedGender == .unknown ? nil : String(selectedGender.rawValue)
            
            await memberStore.updateProfile(
                nickname: nickname,
                email: nil,
                gender: genderString,
                birthday: birthdayString
            )
            
            if memberStore.errorMessage == nil {
                showSaveSuccess = true
            }
        }
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: dateString)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ProfileView()
    }
}
