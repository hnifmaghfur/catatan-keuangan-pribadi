'use client';

import React from 'react';
import { Home, ListOrdered, PlusCircle, PieChart, MessageCircle } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'history' | 'budget' | 'whatsapp';
  onTabChange: (tab: 'home' | 'history' | 'budget' | 'whatsapp') => void;
  onOpenAddModal: () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenAddModal }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 z-40 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'home' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[11px]">Beranda</span>
      </button>

      <button
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'history' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <ListOrdered className="w-5 h-5" />
        <span className="text-[11px]">Riwayat</span>
      </button>

      {/* Floating Center Action Button */}
      <button
        onClick={onOpenAddModal}
        className="flex flex-col items-center -mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
        title="Catat Pengeluaran"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <button
        onClick={() => onTabChange('budget')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'budget' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span className="text-[11px]">Budget</span>
      </button>

      <button
        onClick={() => onTabChange('whatsapp')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'whatsapp' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-[11px]">Bot Chat</span>
      </button>
    </nav>
  );
}
