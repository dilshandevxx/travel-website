// Root of the simulator: a top bar to switch between the customer app, the provider app,
// both side by side (Dual View) and the admin web dashboard.

import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import PlatformSwitcher, { type Platform } from './components/common/PlatformSwitcher';
import MobileAppContainer from './components/mobile/MobileAppContainer';
import CustomerApp from './components/customer/CustomerApp';
import ProviderApp from './components/provider/ProviderApp';
import AdminDashboard from './components/admin/AdminDashboard';
import DualView from './components/sync/DualView';

const PLATFORM_KEY = 'helpdesk.platform';
const PLATFORMS: Platform[] = ['dual', 'customer', 'provider', 'admin'];

function readPlatform(): Platform {
  try {
    const saved = localStorage.getItem(PLATFORM_KEY) as Platform | null;
    if (saved && PLATFORMS.includes(saved)) return saved;
  } catch {
    // storage blocked
  }
  return 'dual';
}

export default function App() {
  const [platform, setPlatform] = useState<Platform>(readPlatform);

  useEffect(() => {
    try {
      localStorage.setItem(PLATFORM_KEY, platform);
    } catch {
      // storage blocked
    }
  }, [platform]);

  return (
    <div className="flex min-h-full flex-col">
      <PlatformSwitcher value={platform} onChange={setPlatform} />
      <main className="flex flex-1 justify-center">
        {platform === 'dual' && <DualView />}
        {platform === 'customer' && (
          <div className="py-6">
            <AuthProvider scope="customer">
              <MobileAppContainer variant="customer">
                <CustomerApp />
              </MobileAppContainer>
            </AuthProvider>
          </div>
        )}
        {platform === 'provider' && (
          <div className="py-6">
            <AuthProvider scope="provider">
              <MobileAppContainer variant="provider">
                <ProviderApp />
              </MobileAppContainer>
            </AuthProvider>
          </div>
        )}
        {platform === 'admin' && (
          <AuthProvider scope="admin">
            <AdminDashboard />
          </AuthProvider>
        )}
      </main>
    </div>
  );
}
