import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex justify-center text-slate-800">
      <main className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col relative shadow-2xl overflow-x-hidden border-x border-slate-200">
        {children}
      </main>
    </div>
  );
}
