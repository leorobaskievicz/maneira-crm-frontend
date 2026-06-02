'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const DEFAULT = {
  name: 'Clínica Caroline Maneira',
  phone: '(41) 98444-3694',
  address: 'Rua Amaro de Santa Rita, 357, Sala 2 - Curitiba/PR',
  hours: 'Segunda a Sábado, 9h às 18h',
  email: 'contato@carolinemaneira.com.br',
  instagram: '@carolinemaneira',
};

export function ClinicTab() {
  const [form, setForm] = useState(DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem('clinic_config');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const save = () => {
    localStorage.setItem('clinic_config', JSON.stringify(form));
    toast.success('Configurações salvas!');
  };

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-xs text-gray-400">Informações da clínica usadas no sistema e nas landing pages.</p>
      {[
        { key: 'name', label: 'Nome da clínica' },
        { key: 'phone', label: 'Telefone / WhatsApp' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Endereço completo' },
        { key: 'hours', label: 'Horário de funcionamento' },
        { key: 'instagram', label: 'Instagram' },
      ].map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          <Input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <Button onClick={save} className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
    </div>
  );
}
