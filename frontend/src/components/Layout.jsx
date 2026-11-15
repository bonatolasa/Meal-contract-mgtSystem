import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, Utensils, CreditCard, BarChart3, Bell, LogOut, Menu, X, Soup, ClipboardList, BookOpen
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {sidebarOpen && <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-indigo-950 text-white shadow-xl transition-all duration-300 ease-in-out lg:translate-x-0 lg:shadow-none ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
          <span className={`text-lg font-bold tracking-tight ${sidebarCollapsed ? 'lg:hidden' : ''}`}>MealContract</span>
          {sidebarCollapsed && <span className="hidden lg:grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-sm font-black">M</span>}
          <button aria-label="Close navigation" className="btn-icon lg:hidden text-white hover:bg-indigo-800" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-white/10 transition-colors ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  isActive ? 'bg-indigo-800 border-l-4 border-white' : 'border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="shrink-0" size={18} />
              <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm min-h-16 flex items-center justify-between gap-2 px-3 sm:px-4 sticky top-0 z-30">
          <button aria-label="Open navigation" className="btn-icon lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <button aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="btn-icon hidden text-gray-600 lg:inline-flex" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>
            <Menu size={20} />
          </button>
          <h1 className="text-sm sm:text-lg font-semibold text-gray-800 truncate">Restaurant Contract Management</h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {notificationPath && <Link to={notificationPath} aria-label="Open notifications" className="btn-icon relative text-slate-600"><Bell size={19} /></Link>}
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">{user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-1 sm:gap-2 px-3 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
