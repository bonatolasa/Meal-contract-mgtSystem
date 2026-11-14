import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ContractsPage from './pages/ContractsPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import MealPackagesPage from './pages/MealPackagesPage';
import StudentNotificationsPage from './pages/StudentNotificationsPage';
import UsersPage from './pages/UsersPage';
import StudentMealsPage from './pages/StudentMealsPage';
import MealAttendancePage from './pages/MealAttendancePage';
import FoodMenuPage from './pages/FoodMenuPage';
import MealServingPage from './pages/MealServingPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user, homePath } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-gray-600">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to={homePath} replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><DashboardPage /></ProtectedRoute>} />
        <Route path="owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><DashboardPage /></ProtectedRoute>} />
        <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardPage /></ProtectedRoute>} />
        <Route path="student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><DashboardPage /></ProtectedRoute>} />
        <Route path="student/meals" element={<ProtectedRoute allowedRoles={['student']}><StudentMealsPage /></ProtectedRoute>} />
        <Route path="student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotificationsPage /></ProtectedRoute>} />
        <Route path="employee/dashboard" element={<ProtectedRoute allowedRoles={['employee']}><DashboardPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute allowedRoles={['owner', 'employee']}><CustomersPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="contracts" element={<ProtectedRoute allowedRoles={['owner']}><ContractsPage /></ProtectedRoute>} />
        <Route path="packages" element={<ProtectedRoute allowedRoles={['owner']}><MealPackagesPage /></ProtectedRoute>} />
        <Route path="food-menu" element={<ProtectedRoute allowedRoles={['owner']}><FoodMenuPage /></ProtectedRoute>} />
        <Route path="meal-attendance" element={<ProtectedRoute allowedRoles={['owner']}><MealAttendancePage /></ProtectedRoute>} />
        <Route path="meal-serving" element={<ProtectedRoute allowedRoles={['owner', 'employee']}><MealServingPage /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute allowedRoles={['owner']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowedRoles={['owner']}><ReportsPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute allowedRoles={['owner']}><NotificationsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
