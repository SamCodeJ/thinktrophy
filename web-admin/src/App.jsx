import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import GameSessions from './pages/GameSessions';
import GameSessionDetail from './pages/GameSessionDetail';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="questions"          element={<Questions />} />
        <Route path="categories"         element={<Categories />} />
        <Route path="transactions"       element={<Transactions />} />
        <Route path="users"              element={<Users />} />
        <Route path="users/:id"          element={<UserDetail />} />
        <Route path="game-sessions"      element={<GameSessions />} />
        <Route path="game-sessions/:id"  element={<GameSessionDetail />} />
        <Route path="settings"           element={<Settings />} />
        <Route path="statistics"         element={<Statistics />} />
      </Route>
    </Routes>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*"    element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
