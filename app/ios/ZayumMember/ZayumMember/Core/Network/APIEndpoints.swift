enum APIEndpoints {
    static let baseURL = "http://192.168.3.11:3000/api"
    
    static let login = "/member/login"
    static let register = "/member/register"
    static let smsCode = "/member/sms-code"
    static let logout = "/member/logout"
    static let profile = "/member/profile"
    static let balanceRecords = "/member/balance-records"
    static let scoreRecords = "/member/score-records"
    static let rechargeBalance = "/member/recharge/balance"
    static let rechargeScore = "/member/recharge/score"
}
