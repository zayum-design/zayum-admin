import SwiftUI

struct ContentView: View {
    @State private var authStore = AuthStore.shared
    
    var body: some View {
        MainView()
            .sheet(isPresented: $authStore.showLoginSheet) {
                NavigationStack {
                    LoginView(isSheet: true)
                }
            }
            .onAppear {
                authStore.checkAuth()
            }
    }
}
