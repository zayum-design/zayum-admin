//
//  MemberStore.swift
//  ZayumMember
//
//  Created by Kimi on 2026/3/27.
//

import Foundation
import Observation

@Observable
class MemberStore {
    static let shared = MemberStore()
    
    var profile: Member?
    var balanceRecords: [BalanceRecord] = []
    var scoreRecords: [ScoreRecord] = []
    var isLoading: Bool = false
    var errorMessage: String?
    
    private let memberService = MemberService.shared
    
    private init() {}
    
    // MARK: - 获取用户资料
    func fetchProfile() async {
        isLoading = true
        errorMessage = nil
        do {
            let member = try await memberService.getProfile()
            profile = member
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 更新用户资料
    func updateProfile(nickname: String?, email: String?, gender: String?, birthday: String?) async {
        isLoading = true
        errorMessage = nil
        
        // 转换 gender 字符串为 Gender 枚举
        let genderEnum: Gender? = {
            guard let gender = gender else { return nil }
            switch gender {
            case "1": return .male
            case "2": return .female
            default: return .unknown
            }
        }()
        
        do {
            let updatedProfile = try await memberService.updateProfile(
                nickname: nickname,
                email: email,
                gender: genderEnum,
                birthday: birthday
            )
            profile = updatedProfile
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 获取余额记录
    func fetchBalanceRecords() async {
        isLoading = true
        errorMessage = nil
        do {
            let records = try await memberService.getBalanceRecords()
            balanceRecords = records
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // MARK: - 获取积分记录
    func fetchScoreRecords() async {
        isLoading = true
        errorMessage = nil
        do {
            let records = try await memberService.getScoreRecords()
            scoreRecords = records
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
