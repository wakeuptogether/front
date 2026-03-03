import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AlarmFormPage from './pages/AlarmFormPage';
import AlarmRingPage from './pages/AlarmRingPage';
import './App.css';

import SignupPage from './pages/SignupPage';
import AlarmMonitor from './components/AlarmMonitor';

function App() {

  useEffect(() => {
    const ping = () => {
      fetch('https://backend-ynng.onrender.com/api/time/current')
        .catch(() => {});
    };
    ping(); // 앱 시작하자마자 한 번 깨우기
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <AlarmMonitor />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/group/:id" element={<GroupDetailPage />} />
        <Route path="/group/:id/alarm/new" element={<AlarmFormPage />} />
        <Route path="/group/:id/alarm/:alarmId" element={<AlarmFormPage />} />
        <Route path="/alarm-ring/:alarmId" element={<AlarmRingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;