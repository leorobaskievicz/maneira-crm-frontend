'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700', cancelled: 'bg-gray-50 text-gray-400',
};

interface Props {
  open: boolean; onClose: () => void; onSave: (data: any) => void;
  onStatusChange?: (id: string, status: string) => void;
  appointment?: any; defaultDate?: Date | null;
}

export function AppointmentDialog({ open, onClose, onSave, onStatusChange, appointment, defaultDate }: Props) {
  const [patients, setPatients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      api.get('/patients').then(r => setPatients(r.data));
      api.get('/procedures-catalog').then(r => setProcedures(r.data));
    }
  }, [open]);

  useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patient?.id || '');
      setProcedureId(appointment.procedure?.id || '');
      setScheduledAt(appointment.scheduledAt ? format(new Date(appointment.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '');
      setDurationMin(String(appointment.durationMin || 60));
      setNotes(appointment.notes || '');
    } else {
      setPatientId(''); setProcedureId(''); setNotes('');
      setDurationMin('60');
      setScheduledAt(defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '');
    }
  }, [appointment, defaultDate, open]);

  const handleProcedureChange = (id: string) => {
    setProcedureId(id);
    const proc = procedures.find(p => p.id === id);
    if (proc) setDurationMin(String(proc.durationMin));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      patient: { id: patientId },
      procedure: { id: procedureId },
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: +durationMin,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="tracking-wide uppercase text-sm font-bold">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        {/* Status buttons (edição) */}
        {appointment && onStatusChange && (
          <div className="flex flex-wrap gap-1 pb-2 border-b">
            {Object.entries(statusLabels).map(([key, label]) => (
              <button key={key} onClick={() => onStatusChange(appointment.id, key)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${appointment.status === key ? statusColors[key] + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione a paciente" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Procedimento *</Label>
            <Select value={procedureId} onValueChange={handleProcedureChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
              <SelectContent>
                {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data e hora *</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duração (min)</Label>
              <Input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações..." rows={2} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
