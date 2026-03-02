import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingModal, type OnboardingData } from './components/OnboardingModal';
import LandingPage from './pages/LandingPage';
import PlaybooksPage from './pages/PlaybooksPage';
import PlaybookViewerPage from './pages/PlaybookViewerPage';
import WorkspacePage from './pages/WorkspacePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import PlaybookEditorPage from './pages/PlaybookEditorPage';
import CrashCoursePage from './pages/CrashCoursePage';
import AutopilotPage from './pages/AutopilotPage';

// Inner component — can use useAuth because it's inside AuthProvider
function AppWithOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const key = `hb_onboarding_${user.id}`;
    const done = localStorage.getItem(key);

    if (!done) {
      // Small delay so the page finishes rendering first
      const t = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleOnboardingComplete = (_data: OnboardingData) => {
    setShowOnboarding(false);
    navigate('/playbooks');
  };

  const handleOnboardingDismiss = () => {
    // Mark as dismissed so it doesn't reappear this session
    if (user) {
      localStorage.setItem(`hb_onboarding_${user.id}`, JSON.stringify({ dismissed: true, completedAt: new Date().toISOString() }));
    }
    setShowOnboarding(false);
  };

  return (
    <>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/playbooks" element={<PlaybooksPage />} />
        <Route path="/playbooks/:slug" element={<PlaybookViewerPage />} />
        <Route path="/crash-course" element={<CrashCoursePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/autopilot" element={<AutopilotPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/playbooks/new" element={<PlaybookEditorPage />} />
        <Route path="/admin/playbooks/:id/edit" element={<PlaybookEditorPage />} />
      </Routes>

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
