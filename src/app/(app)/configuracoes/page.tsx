'use client';
import { useState } from 'react';
import { ProceduresTab } from './procedures-tab';
import { ProductsTab } from './products-tab';
import { ClinicTab } from './clinic-tab';

const tabs = ['Procedimentos', 'Produtos', 'Clínica'];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase mb-6">Configurações</h1>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ${tab === i ? 'border-[#A0585A] text-[#A0585A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <ProceduresTab />}
      {tab === 1 && <ProductsTab />}
      {tab === 2 && <ClinicTab />}
    </div>
  );
}
