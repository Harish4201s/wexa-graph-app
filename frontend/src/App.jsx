import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DeveloperDirectory from './pages/DeveloperDirectory';
import ProjectExplorer from './pages/ProjectExplorer';
import SkillGraphPage from './pages/SkillGraphPage';
import { api } from './api/client';

function DbStatusBanner() {
  const [status, setStatus] = useState('checking'); // checking | ok | down

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((res) => {
        if (!cancelled) setStatus(res.database === 'connected' ? 'ok' : 'down');
      })
      .catch(() => {
        if (!cancelled) setStatus('down');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status !== 'down') return null;

  return (
    <div className="bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
      ⚠️ CognoDB is currently unreachable from the API server. Data may not load until connectivity is restored.
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <DbStatusBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<DeveloperDirectory />} />
        <Route path="/projects" element={<ProjectExplorer />} />
        <Route path="/graph" element={<SkillGraphPage />} />
      </Routes>
    </div>
  );
}
