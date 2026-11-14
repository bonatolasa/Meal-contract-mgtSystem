import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  const navItems = user?.role === 'student' ? studentNavItems : user?.role === 'employee' ? employeeNavItems : user?.role === 'admin' ? adminNavItems : ownerNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {sidebarOpen && <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-indigo-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
          <span className="text-lg font-bold">MealContract</span>
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
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium hover:bg-indigo-800 transition-colors ${
                  isActive ? 'bg-indigo-800 border-l-4 border-white' : 'border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="mr-3" size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm min-h-16 flex items-center justify-between gap-2 px-3 sm:px-4 sticky top-0 z-30">
          <button aria-label="Open navigation" className="btn-icon lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-sm sm:text-lg font-semibold text-gray-800 truncate">Restaurant Contract Management</h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
