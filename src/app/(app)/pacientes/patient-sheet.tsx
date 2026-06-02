'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};
const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600', no_show: 'bg-red-100 text-red-700', cancelled: 'bg-gray-50 text-gray-400', in_progress: 'bg-yellow-100 text-yellow-700',
};

interface Props { open: boolean; onClose: () => void; patient: any; onSave: (data: any) => void; }

export function PatientSheet({ open, onClose, patient, onSave }: Props) {
  const [tab, setTab] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (patient && open) {
      setForm({ name: patient.name, phone: patient.phone || '', email: patient.email || '', birthDate: patient.birthDate?.split('T')[0] || '', address: patient.address || '', allergies: patient.allergies || '', contraindications: patient.contraindications || '', notes: patient.notes || '' });
      api.get(`/appointments/patient/${patient.id}`).then(r => setAppointments(r.data)).catch(() => {});
      api.get(`/medical-records/patient/${patient.id}`).then(r => setRecords(r.data)).catch(() => {});
    }
  }, [patient, open]);

  const totalGasto = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + Number(a.procedure?.price || 0), 0);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const tabs = ['Dados', 'Histórico', 'Financeiro'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide text-sm font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: '#A0585A' }}>
              {patient?.name?.charAt(0)}
            </div>
            {patient?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b flex-shrink-0">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors border-b-2 -mb-px ${tab === i ? 'border-[#A0585A] text-[#A0585A]' : 'border-transparent text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Dados */}
          {tab === 0 && (
            <div className="space-y-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Nascimento</Label><Input type="date" value={form.birthDate || ''} onChange={e => setForm((f: any) => ({ ...f, birthDate: e.target.value }))} /></div>
                <div className="col-span-2 space-y-1"><Label>Email</Label><Input value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
                <div className="col-span-2 space-y-1"><Label>Endereço</Label><Input value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
                <div className="col-span-2 space-y-1"><Label>Alergias</Label><Textarea value={form.allergies || ''} onChange={e => setForm((f: any) => ({ ...f, allergies: e.target.value }))} rows={2} /></div>
                <div className="col-span-2 space-y-1"><Label>Contraindicações</Label><Textarea value={form.contraindications || ''} onChange={e => setForm((f: any) => ({ ...f, contraindications: e.target.value }))} rows={2} /></div>
                <div className="col-span-2 space-y-1"><Label>Observações</Label><Textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button onClick={() => onSave(form)} className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
              </div>
            </div>
          )}

          {/* Histórico */}
          {tab === 1 && (
            <div className="py-3 space-y-2">
              {appointments.length === 0 && <p className="text-xs text-gray-400 text-center py-8">Nenhum atendimento</p>}
              {appointments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.procedure?.name}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(a.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <Badge className={`text-xs border-0 ${statusColors[a.status]}`}>{statusLabels[a.status]}</Badge>
                  <span className="text-xs font-medium text-gray-700 flex-shrink-0">{fmt(a.procedure?.price || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financeiro */}
          {tab === 2 && (
            <div className="py-3 space-y-4">
              <div className="p-4 rounded-xl text-center" style={{ background: '#A0585A' }}>
                <p className="text-xs text-white/70 uppercase tracking-wider">Total investido</p>
                <p className="text-3xl font-bold text-white mt-1">{fmt(totalGasto)}</p>
                <p className="text-xs text-white/70 mt-1">{appointments.filter(a => a.status === 'completed').length} procedimentos</p>
              </div>
              <div className="space-y-2">
                {appointments.filter(a => a.status === 'completed').map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{a.procedure?.name}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(a.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <span className="font-semibold text-gray-800">{fmt(a.procedure?.price || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
