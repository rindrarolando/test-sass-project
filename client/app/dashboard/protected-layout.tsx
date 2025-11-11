'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Layout protégé - Vérifie l'authentification
 * 🔧 VERSION DEMO - Toujours autoriser l'accès
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  // 🔧 VERSION DEMO - Toujours afficher le contenu
  if (!isAuthenticated && !isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

