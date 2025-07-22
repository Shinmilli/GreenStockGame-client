// app/contexts/GameProvider.tsx
'use client';

import { SimpleGameProvider, GameHelpModal } from './SimpleGameContext';

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <SimpleGameProvider>
      {children}
      <GameHelpModal />
    </SimpleGameProvider>
  );
}