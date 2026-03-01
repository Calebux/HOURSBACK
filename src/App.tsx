import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import PlaybooksPage from './pages/PlaybooksPage';
import PlaybookViewerPage from './pages/PlaybookViewerPage';
import WorkspacePage from './pages/WorkspacePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import PlaybookEditorPage from './pages/PlaybookEditorPage';
import CrashCoursePage from './pages/CrashCoursePage';
import AutopilotPage from './pages/AutopilotPage';

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
