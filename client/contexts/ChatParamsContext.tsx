'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ========================== INTERFACES ==========================

interface ChatParamsContextType {
  value: string | null;
  setValue: (value: string | null) => void;
}

// ========================== CONTEXT ==========================

const ChatParamsContext = createContext<ChatParamsContextType | undefined>(undefined);

// ========================== PROVIDER ==========================

export function ChatParamsProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<string | null>(null);

  // ✅ Handler stabilisé avec useCallback
  const stableSetValue = useCallback((newValue: string | null) => {
    setValue(newValue);
  }, []);

  // ✅ Valeur stabilisée avec useMemo
  const contextValue = useMemo(() => ({
    value,
    setValue: stableSetValue
  }), [value, stableSetValue]);

  return (
    <ChatParamsContext.Provider value={contextValue}>
      {children}
    </ChatParamsContext.Provider>
  );
}

// ========================== HOOK ==========================

export function useChatParamsContext(): ChatParamsContextType {
  const context = useContext(ChatParamsContext);
  if (!context) {
    throw new Error('useChatParamsContext must be used within ChatParamsProvider');
  }
  return context;
}

