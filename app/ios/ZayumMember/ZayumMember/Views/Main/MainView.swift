import SwiftUI

struct MainView: View {
    #if os(iOS)
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    #endif
    
    var body: some View {
        #if os(iOS)
        if UIDevice.current.userInterfaceIdiom == .pad {
            SidebarView()
        } else {
            MainTabView()
        }
        #else
        SidebarView()
        #endif
    }
}
