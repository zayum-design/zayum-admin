import SwiftUI

struct ScoreRechargeView: View {
    @State private var selectedScore: Double?
    @State private var paymentMethod: PaymentMethod = .alipay
    
    let presetScores: [Double] = [100, 500, 1000, 5000]
    let exchangeRate: Double = 10 // 1元 = 10积分
    
    var finalScore: Double {
        selectedScore ?? 0
    }
    
    var needPay: Double {
        finalScore / exchangeRate
    }
    
    var body: some View {
        Form {
            Section("选择积分数量") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 12) {
                    ForEach(presetScores, id: \.self) { score in
                        ScoreButton(
                            score: score,
                            isSelected: selectedScore == score
                        ) {
                            selectedScore = score
                        }
                    }
                }
            }
            
            Section("兑换比例") {
                HStack {
                    Text("兑换率")
                    Spacer()
                    Text("1元 = 10积分")
                        .foregroundStyle(.secondary)
                }
            }
            
            Section("支付信息") {
                HStack {
                    Text("获得积分")
                    Spacer()
                    Text("\(Int(finalScore))")
                        .fontWeight(.bold)
                        .foregroundStyle(.orange)
                }
                
                HStack {
                    Text("需支付")
                    Spacer()
                    Text("¥\(String(format: "%.2f", needPay))")
                        .fontWeight(.bold)
                        .foregroundStyle(.blue)
                }
            }
            
            Section {
                Button("立即兑换") {
                    // 充值逻辑
                }
                .disabled(finalScore <= 0)
            }
        }
        .navigationTitle("积分充值")
    }
}

// 积分选择按钮组件
struct ScoreButton: View {
    let score: Double
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text("\(Int(score))")
                .fontWeight(isSelected ? .bold : .regular)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(isSelected ? Color.orange.opacity(0.1) : Color.gray.opacity(0.1))
                .foregroundStyle(isSelected ? .orange : .primary)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
                )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationStack {
        ScoreRechargeView()
    }
}
