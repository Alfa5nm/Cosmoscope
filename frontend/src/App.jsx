import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import SolarSystemPage from './pages/SolarSystemPage.jsx';
import BodyDetailPage from './pages/BodyDetailPage.jsx';
import ResearchWorkbench from './components/ResearchWorkbench.jsx';
import { SpaceAudioProvider } from './state/SpaceAudioContext.js';

export default function App() {
  return (
    <SpaceAudioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<SolarSystemPage />} />
          <Route path="/explore/:bodyId" element={<BodyDetailPage />} />
          <Route path="/workbench" element={<ResearchWorkbench />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SpaceAudioProvider>
  );
}
