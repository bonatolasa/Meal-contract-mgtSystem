import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, Utensils, CreditCard, BarChart3, Bell, LogOut, Menu, X, Soup, ClipboardList, BookOpen, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const ownerNavItems = [
  { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/packages', label: 'Meal Packages', icon: Soup },
  { path: '/food-menu', label: 'Food Menu', icon: BookOpen },
  { path: '/meal-attendance', label: 'Daily Meal Attendance', icon: ClipboardList },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Staff & Accounts', icon: Users },
];

const employeeNavItems = [
  { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Find Customer', icon: Users },
  { path: '/meal-serving', label: 'Confirm Meal Serving', icon: Utensils },
];

const studentNavItems = [
  { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/meals', label: 'Daily Meal Selection', icon: Utensils },
  { path: '/student/notifications', label: 'Notifications', icon: Bell },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navItems = user?.role === 'student' ? studentNavItems : user?.role === 'employee' ? employeeNavItems : user?.role === 'admin' ? adminNavItems : ownerNavItems;
  const notificationPath = user?.role === 'student' ? '/student/notifications' : ['owner', 'admin'].includes(user?.role) ? '/notifications' : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell flex min-h-screen">
      {/* Sidebar */}
      {sidebarOpen && <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto text-white transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-[76px] px-5 border-b border-white/10">
          <span className={`flex items-center gap-3 text-base font-bold tracking-tight ${sidebarCollapsed ? 'lg:hidden' : ''}`}><span className="brand-mark"><Utensils size={17} /></span><span>Table & Thyme<small className="mt-0.5 block text-[10px] font-medium tracking-[0.16em] text-white/50">MEAL SERVICES</small></span></span>
          {sidebarCollapsed && <span className="brand-mark hidden lg:grid">T</span>}
          <button aria-label="Close navigation" className="btn-icon lg:hidden text-white hover:bg-indigo-800" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className={`px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{user?.role === 'student' ? 'My account' : user?.role === 'employee' ? 'Service desk' : user?.role === 'admin' ? 'Administration' : 'Restaurant'}</div>
        <nav className="px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `nav-item flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  isActive ? 'nav-item-active' : ''
                }`
              }
            >
              {({ isActive }) => <>
                <item.icon className="shrink-0" size={18} />
                <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                {!sidebarCollapsed && <ChevronRight size={14} className={`text-white/25 transition ${isActive ? 'text-white/70' : ''}`} />}
              </>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="app-header min-h-[76px] flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-30">
          <button aria-label="Open navigation" className="btn-icon lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <button aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="btn-icon hidden text-gray-600 lg:inline-flex" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>
            <Menu size={20} />
          </button>
          <div className="min-w-0"><p className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Restaurant operations</p><h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{user?.role === 'student' ? 'Meal account' : user?.role === 'employee' ? 'Service desk' : user?.role === 'admin' ? 'System administration' : 'Management workspace'}</h1></div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {notificationPath && <Link to={notificationPath} aria-label="Open notifications" className="btn-icon relative text-slate-600"><Bell size={19} /></Link>}
            <span aria-hidden="true" className="profile-avatar">{user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-1 sm:gap-2 px-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="app-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
