import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingModal, type OnboardingData } from './components/OnboardingModal';

// Eagerly loaded — core experience
import LandingPage from './pages/LandingPage';
import WorkflowsDashboard from './pages/WorkflowsDashboard';
import ReportsPage from './pages/ReportsPage';
import AccountPage from './pages/AccountPage';

// Lazily loaded — not needed on first paint
const WorkflowBuilder   = lazy(() => import('./pages/WorkflowBuilder'));
const PlaybooksPage     = lazy(() => import('./pages/PlaybooksPage'));
const PlaybookViewerPage = lazy(() => import('./pages/PlaybookViewerPage'));
const CrashCoursePage   = lazy(() => import('./pages/CrashCoursePage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-dark" />
    </div>
  );
}

function AppWithOnboarding() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `hb_onboarding_${user.id}`;
    const done = localStorage.getItem(key);
    if (!done) {
      const t = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleOnboardingComplete = (_data: OnboardingData) => {
    setShowOnboarding(false);
    navigate('/workflows');
  };

  const handleOnboardingDismiss = () => {
    if (user) {
      localStorage.setItem(`hb_onboarding_${user.id}`, JSON.stringify({ dismissed: true, completedAt: new Date().toISOString() }));
    }
    setShowOnboarding(false);
  };

  return (
    <>
      <ToastProvider />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isLoading ? null : user ? <Navigate to="/workflows" replace /> : <LandingPage />} />
          <Route path="/playbooks" element={<PlaybooksPage />} />
          <Route path="/playbooks/:slug" element={<PlaybookViewerPage />} />
          <Route path="/crash-course" element={<CrashCoursePage />} />
          <Route path="/workspace" element={<Navigate to="/workflows" replace />} />
          <Route path="/workflows" element={<WorkflowsDashboard />} />
          <Route path="/workflows/new" element={<WorkflowBuilder />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Suspense>

      <AnimatePresence>
        {showOnboarding && user && (
          <OnboardingModal
            userId={user.id}
            onComplete={handleOnboardingComplete}
            onDismiss={handleOnboardingDismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWithOnboarding />
      </Router>
    </AuthProvider>
  );
}

export default App;
