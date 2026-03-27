import SwiftUI

struct BalanceRechargeView: View {
    @State private var selectedAmount: Double?
    @State private var customAmount: String = ""
    @State private var paymentMethod: PaymentMethod = .alipay
    @State private var isRecharging = false
    @State private var showSuccess = false
    
    let presetAmounts: [Double] = [10, 50, 100, 500, 1000]
    
    var finalAmount: Double {
        if let custom = Double(customAmount), custom > 0 {
            return custom
        }
        return selectedAmount ?? 0
    }
    
    var body: some View {
        Form {
            Section("选择充值金额") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 12) {
                    ForEach(presetAmounts, id: \.self) { amount in
                        AmountButton(
                            amount: amount,
                            isSelected: selectedAmount == amount && customAmount.isEmpty
                        ) {
                            selectedAmount = amount
                            customAmount = ""
                        }
                    }
                }
                
                TextField("自定义金额", text: $customAmount)
                    .keyboardType(.decimalPad)
                    .onChange(of: customAmount) { _ in
                        selectedAmount = nil
                    }
            }
            
            Section("支付方式") {
                Picker("支付方式", selection: $paymentMethod) {
                    ForEach(PaymentMethod.allCases, id: \.self) { method in
                        Text(method.rawValue).tag(method)
                    }
                }
                .pickerStyle(.segmented)
            }
            
            Section {
                HStack {
                    Text("支付金额")
                    Spacer()
                    Text("¥\(String(format: "%.2f", finalAmount))")
                        .fontWeight(.bold)
                        .foregroundStyle(.blue)
                }
            }
            
            Section {
                Button(action: recharge) {
                    if isRecharging {
                        ProgressView()
                    } else {
                        Text("立即充值")
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(finalAmount <= 0 || isRecharging)
            }
        }
        .navigationTitle("余额充值")
        .alert("充值成功", isPresented: $showSuccess) {
            Button("确定") { }
        }
    }
    
    private func recharge() {
        // 调用 RechargeService
    }
}

// 金额选择按钮组件
struct AmountButton: View {
    let amount: Double
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text("¥\(Int(amount))")
                .fontWeight(isSelected ? .bold : .regular)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                .foregroundStyle(isSelected ? .blue : .primary)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationStack {
        BalanceRechargeView()
    }
}
