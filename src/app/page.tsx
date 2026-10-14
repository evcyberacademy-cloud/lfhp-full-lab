'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { VFSProvider } from '@/context/VFSContext';
import { LabProvider } from '@/context/LabContext';
import { DesktopProvider } from '@/context/DesktopContext';
import { AccessGate } from '@/components/auth/AccessGate';
import { Desktop } from '@/components/desktop/Desktop';

function MainApplicationContent() {
  const { authState, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#040812] flex flex-col items-center justify-center text-cyan-400 font-mono text-sm select-none">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase text-xs">Initializing EV Cyber-Labs...</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <AccessGate />;
  }

  return (
    <VFSProvider>
      <LabProvider>
        <DesktopProvider>
          <Desktop />
        </DesktopProvider>
      </LabProvider>
    </VFSProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApplicationContent />
    </AuthProvider>
  );
}
