import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from '../context/ToastContext';
import Toaster from '../components/ui/Toaster';

export default function AppLayout() {
  return (
    <ToastProvider>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-page)',
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <main
            className="overflow-y-auto"
            style={{
              flex: 1,
              padding: '28px 32px',
              backgroundColor: 'var(--bg-page)',
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  );
}
