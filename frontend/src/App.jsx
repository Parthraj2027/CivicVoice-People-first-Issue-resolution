
import React, { useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LandingPage from '@/pages/LandingPage';
import LoginSelectionPage from '@/features/auth/LoginSelectionPage';
import DashboardPage from '@/pages/DashboardPage';
import CitizenLoginPage from '@/features/auth/CitizenLoginPage';
import AdminLoginPage from '@/features/auth/LoginPage';
import DepartmentLoginPage from '@/features/auth/DepartmentLoginPage';
import NGOLoginPage from '@/features/auth/NGOLoginPage';
import CitizenHomePage from '@/features/citizen/CitizenHomePage';
import QuickReportPage from '@/features/citizen/QuickReportPage';
import CitizenDashboardPage from '@/features/citizen/CitizenDashboardPage';
import AdminPage from '@/features/admin/AdminPage';
import DepartmentHomePage from '@/features/department/DepartmentHomePage';
import NGOPortalPage from '@/features/ngo/NGOPortalPage';
import AccountPage from '@/features/account/AccountPage';
import ReportWizardPage from '@/pages/ReportWizardPage';
import IssueTrackerPage from '@/pages/IssueTrackerPage';
import ImpactPage from '@/pages/ImpactPage';
import NGODirectoryPage from '@/pages/NGODirectoryPage';
import NGOProfilePage from '@/pages/NGOProfilePage';
import CommunityPage from '@/pages/CommunityPage';
import JagrukPage from '@/pages/JagrukPage';
import JagrukChatbot from '@/components/JagrukChatbot';
import { fetchMe } from '@/features/auth/authSlice';

const getHomeRoute = (role) => {
  if (role === 'citizen') return '/citizen';
  if (role === 'admin') return '/admin';
  if (role === 'department') return '/department';
  if (role === 'ngo') return '/ngo';
  return '/';
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    const from = `${location.pathname}${location.search || ''}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
};

const AppShell = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isDashboardPage = location.pathname === '/dashboard';

  const handleLogoClick = () => {
    if (user?.role === 'citizen') navigate('/citizen');
    else if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'department') navigate('/department');
    else if (user?.role === 'ngo') navigate('/ngo');
    else navigate('/');
  };

  // Don't show header/footer on landing page or dashboard page
  if (isLandingPage || isDashboardPage) {
    return <div className="app-root">{children}</div>;
  }

  return (
    <div className="app-root">
      <div className="animated-bg"></div>
      <header className="app-header fade-in">
        <button className="logo-btn" onClick={handleLogoClick}>
          <span className="logo-mark">CV</span>
          <span className="logo-text">
            Civic<span>Voice</span>
          </span>
        </button>
        <nav className="nav-links">
          {user ? (
            <>
              {user.role === 'ngo' && (
                <Link to="/ngo" className="nav-link">
                  NGO Portal
                </Link>
              )}
              <Link to="/jagruk" className="nav-link">
                Jagruk
              </Link>
              <Link to="/account" className="nav-link nav-pill">
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link to="/jagruk" className="nav-link">
                Jagruk
              </Link>
              <Link to="/login" className="nav-link">
                Sign in
              </Link>
              <Link to="/login" className="nav-link nav-pill">
                Login
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main slide-up">{children}</main>
      <footer className="app-footer fade-in">
        <span>CivicVoice · Smart civic issue reporting & tracking</span>
      </footer>
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <AppShell>
      <JagrukChatbot />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginSelectionPage />} />
        <Route path="/login/citizen" element={<CitizenLoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/login/department" element={<DepartmentLoginPage />} />
        <Route path="/login/ngo" element={<NGOLoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenHomePage /></ProtectedRoute>} />
        <Route path="/citizen/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboardPage /></ProtectedRoute>} />
        <Route path="/ngo" element={<ProtectedRoute allowedRoles={['ngo']}><NGOPortalPage /></ProtectedRoute>} />
        <Route path="/quick-report" element={<ProtectedRoute allowedRoles={['citizen']}><QuickReportPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportWizardPage /></ProtectedRoute>} />
        <Route path="/track/:id" element={<ProtectedRoute><IssueTrackerPage /></ProtectedRoute>} />
        <Route path="/impact" element={<ProtectedRoute><ImpactPage /></ProtectedRoute>} />
        <Route path="/ngos" element={<ProtectedRoute><NGODirectoryPage /></ProtectedRoute>} />
        <Route path="/ngos/:id" element={<ProtectedRoute><NGOProfilePage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/jagruk" element={<JagrukPage />} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
        <Route path="/department" element={<ProtectedRoute allowedRoles={['department']}><DepartmentHomePage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;
