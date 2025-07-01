import { Home, Users, Film, PenTool, CheckCircle, Calendar, Image, Bookmark, Map, Quote, Moon, Sun, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, showProfileSelector } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "Family Tree", path: "/family", icon: Users },
    { label: "Media Tracker", path: "/media", icon: Film },
    { label: "Journal", path: "/journal", icon: PenTool },
    { label: "Tasks & Habits", path: "/tasks", icon: CheckCircle },
    { label: "Events", path: "/events", icon: Calendar },
    { label: "Gallery", path: "/gallery", icon: Image },
    { label: "Bookmarks", path: "/bookmarks", icon: Bookmark },
    { label: "Travel Map", path: "/travel", icon: Map },
    { label: "Quotes", path: "/quotes", icon: Quote },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SidebarNav 
                  items={navigationItems} 
                  onItemClick={() => setMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Nijalaya</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.name}'s Family Hub</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Profile Button */}
            <Button variant="ghost" size="sm" onClick={showProfileSelector} className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <SidebarNav items={navigationItems} />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-20 md:pb-4 md:ml-64">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={navigationItems.slice(0, 5)} />
    </div>
  );
}
