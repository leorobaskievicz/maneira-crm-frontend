'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AppointmentDialog } from './appointment-dialog';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-400 border-gray-100',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h às 19h

export default function AgendaPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)); // Seg-Sab

  const load = useCallback(async () => {
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const res = await api.get('/appointments', { params: { startDate: start, endDate: end } });
    setAppointments(res.data);
  }, [currentWeek]);

  useEffect(() => { load(); }, [load]);

  const getAppointmentsForSlot = (day: Date, hour: number) => {
    return appointments.filter(apt => {
      const d = parseISO(apt.scheduledAt);
      return isSameDay(d, day) && d.getHours() === hour;
    });
  };

  const handleSave = async (data: any) => {
    try {
      if (selected) await api.put(`/appointments/${selected.id}`, data);
      else await api.post('/appointments', data);
      toast.success(selected ? 'Agendamento atualizado!' : 'Agendamento criado!');
      setDialogOpen(false); setSelected(null); setSelectedSlot(null); load();
    } catch { toast.error('Erro ao salvar agendamento'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success('Status atualizado!');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div className="p-4 max-w-full mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Agenda</h1>
          <p className="text-gray-500 text-sm">
            {format(weekStart, "d 'de' MMM", { locale: ptBR })} — {format(addDays(weekStart, 5), "d 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button className="text-white text-sm" style={{ background: '#A0585A' }}
            onClick={() => { setSelected(null); setSelectedSlot(new Date()); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Agendar
          </Button>
        </div>
      </div>

      {/* Mobile: lista do dia */}
      <div className="md:hidden space-y-2">
        {appointments.filter(a => isSameDay(parseISO(a.scheduledAt), new Date())).length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhum agendamento hoje</p>
        ) : appointments.filter(a => isSameDay(parseISO(a.scheduledAt), new Date())).map(apt => (
          <Card key={apt.id} className="border-0 shadow-sm cursor-pointer"
            onClick={() => { setSelected(apt); setDialogOpen(true); }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="text-center w-12">
                <div className="text-sm font-bold" style={{ color: '#A0585A' }}>
                  {format(parseISO(apt.scheduledAt), 'HH:mm')}
                </div>
                <div className="text-xs text-gray-400">{apt.durationMin}min</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{apt.patient?.name}</div>
                <div className="text-xs text-gray-500">{apt.procedure?.name}</div>
              </div>
              <Badge className={`text-xs ${statusColors[apt.status]}`}>{statusLabels[apt.status]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: grade semanal */}
      <div className="hidden md:block overflow-auto flex-1">
        <div className="grid grid-cols-7 min-w-[700px]">
          {/* Header dias */}
          <div className="col-span-1" />
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`text-center py-2 border-b text-sm font-medium ${isSameDay(day, new Date()) ? 'text-white rounded-t-lg' : 'text-gray-600'}`}
              style={isSameDay(day, new Date()) ? { background: '#A0585A' } : {}}>
              <div className="uppercase text-xs tracking-wider">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-white' : ''}`}>{format(day, 'd')}</div>
            </div>
          ))}

          {/* Horas */}
          {hours.map(hour => (
            <>
              <div key={`h-${hour}`} className="text-xs text-gray-400 pr-2 pt-1 text-right border-r border-gray-100 h-16">
                {hour}:00
              </div>
              {weekDays.map(day => {
                const slots = getAppointmentsForSlot(day, hour);
                return (
                  <div key={`${day}-${hour}`}
                    className="border-b border-r border-gray-100 h-16 relative cursor-pointer hover:bg-rose-50/30 transition-colors"
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      setSelectedSlot(d);
                      setSelected(null);
                      setDialogOpen(true);
                    }}>
                    {slots.map(apt => (
                      <div key={apt.id}
                        className={`absolute inset-x-0.5 top-0.5 rounded px-1 py-0.5 text-xs border cursor-pointer hover:opacity-80 ${statusColors[apt.status]}`}
                        onClick={e => { e.stopPropagation(); setSelected(apt); setDialogOpen(true); }}>
                        <div className="font-medium truncate">{apt.patient?.name}</div>
                        <div className="truncate opacity-75">{apt.procedure?.name}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelected(null); setSelectedSlot(null); }}
        onSave={handleSave}
        onStatusChange={updateStatus}
        appointment={selected}
        defaultDate={selectedSlot}
      />
    </div>
  );
}
