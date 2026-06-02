'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, IconButton, ToggleButton, ToggleButtonGroup, Divider,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#1976D2', confirmed: '#388E3C', in_progress: '#F57C00',
  completed: '#9E9E9E', no_show: '#D32F2F', cancelled: '#BDBDBD',
};
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export default function AgendaPage() {
  const [week, setWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [form, setForm] = useState({ patientId: '', procedureId: '', scheduledAt: '', durationMin: '60', notes: '', status: 'scheduled' });

  const weekStart = startOfWeek(week, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(endOfWeek(week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const r = await api.get('/appointments', { params: { startDate: start, endDate: end } });
    setAppointments(r.data);
  }, [week]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (apt?: any, defaultDate?: Date) => {
    if (apt) {
      setSelected(apt);
      setForm({ patientId: apt.patient?.id || '', procedureId: apt.procedure?.id || '', scheduledAt: format(parseISO(apt.scheduledAt), "yyyy-MM-dd'T'HH:mm"), durationMin: String(apt.durationMin), notes: apt.notes || '', status: apt.status });
    } else {
      setSelected(null);
      setForm({ patientId: '', procedureId: '', scheduledAt: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '', durationMin: '60', notes: '', status: 'scheduled' });
      if (!patients.length) api.get('/patients').then(r => setPatients(r.data));
      if (!procedures.length) api.get('/procedures-catalog').then(r => setProcedures(r.data));
    }
    if (!patients.length) api.get('/patients').then(r => setPatients(r.data));
    if (!procedures.length) api.get('/procedures-catalog').then(r => setProcedures(r.data));
    setOpen(true);
  };

  const save = async () => {
    try {
      const data = { patient: { id: form.patientId }, procedure: { id: form.procedureId }, scheduledAt: new Date(form.scheduledAt).toISOString(), durationMin: +form.durationMin, notes: form.notes, status: form.status };
      if (selected) await api.put(`/appointments/${selected.id}`, data);
      else await api.post('/appointments', data);
      toast.success(selected ? 'Agendamento atualizado!' : 'Agendamento criado!');
      setOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const slotsFor = (day: Date, hour: number) => appointments.filter(a => {
    const d = parseISO(a.scheduledAt);
    return isSameDay(d, day) && d.getHours() === hour;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Agenda</Typography>
          <Typography variant="body2">
            {format(weekStart, "d 'de' MMM", { locale: ptBR })} — {format(addDays(weekStart, 5), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setWeek(subWeeks(week, 1))} sx={{ border: '1px solid #EDE8E8' }}>
            <ChevronLeftOutlinedIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="outlined" onClick={() => setWeek(new Date())} sx={{ borderColor: '#EDE8E8', color: '#6B6B6B', minWidth: 60 }}>
            Hoje
          </Button>
          <IconButton size="small" onClick={() => setWeek(addWeeks(week, 1))} sx={{ border: '1px solid #EDE8E8' }}>
            <ChevronRightOutlinedIcon fontSize="small" />
          </IconButton>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A', ml: 1 }} onClick={() => openDialog()}>
            Agendar
          </Button>
        </Box>
      </Box>

      {/* Mobile: lista do dia */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {appointments.filter(a => isSameDay(parseISO(a.scheduledAt), new Date())).map(apt => (
          <Card key={apt.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => openDialog(apt)}>
            <CardContent sx={{ p: '12px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'center', minWidth: 44 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#A0585A' }}>
                  {format(parseISO(apt.scheduledAt), 'HH:mm')}
                </Typography>
                <Typography variant="caption">{apt.durationMin}min</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{apt.patient?.name}</Typography>
                <Typography variant="body2">{apt.procedure?.name}</Typography>
              </Box>
              <Chip label={STATUS_LABELS[apt.status]} size="small" variant="outlined"
                sx={{ fontSize: '0.7rem', borderColor: STATUS_COLORS[apt.status], color: STATUS_COLORS[apt.status] }} />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Desktop: grade semanal */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, overflow: 'hidden', border: '1px solid #EDE8E8', borderRadius: '6px', backgroundColor: '#fff' }}>
        {/* Coluna de horas */}
        <Box sx={{ width: 56, flexShrink: 0, borderRight: '1px solid #EDE8E8' }}>
          <Box sx={{ height: 56, borderBottom: '1px solid #EDE8E8' }} />
          {HOURS.map(h => (
            <Box key={h} sx={{ height: 64, borderBottom: '1px solid #F5F0F0', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', pr: 1, pt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#BDBDBD', fontSize: '0.7rem' }}>{h}:00</Typography>
            </Box>
          ))}
        </Box>

        {/* Colunas dos dias */}
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          return (
            <Box key={day.toISOString()} sx={{ flex: 1, borderRight: '1px solid #EDE8E8', '&:last-child': { borderRight: 'none' } }}>
              {/* Header dia */}
              <Box sx={{ height: 56, borderBottom: '1px solid #EDE8E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? '#A0585A' : 'transparent' }}>
                <Typography variant="caption" sx={{ color: isToday ? 'rgba(255,255,255,0.8)' : '#9E9E9E', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {format(day, 'EEE', { locale: ptBR })}
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : '#1A1A1A', lineHeight: 1.2 }}>
                  {format(day, 'd')}
                </Typography>
              </Box>

              {/* Slots */}
              {HOURS.map(hour => {
                const slots = slotsFor(day, hour);
                const slotDate = new Date(day); slotDate.setHours(hour, 0, 0, 0);
                return (
                  <Box key={hour} sx={{ height: 64, borderBottom: '1px solid #F5F0F0', position: 'relative', cursor: 'pointer', '&:hover': { backgroundColor: '#FAF8F8' }, px: 0.5, pt: 0.5 }}
                    onClick={() => openDialog(undefined, slotDate)}>
                    {slots.map(apt => (
                      <Box key={apt.id}
                        onClick={e => { e.stopPropagation(); openDialog(apt); }}
                        sx={{ position: 'absolute', inset: '2px 2px 0', borderRadius: '3px', px: 0.75, py: 0.25, backgroundColor: STATUS_COLORS[apt.status] + '22', borderLeft: `2px solid ${STATUS_COLORS[apt.status]}`, cursor: 'pointer', overflow: 'hidden', '&:hover': { filter: 'brightness(0.95)' } }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: STATUS_COLORS[apt.status], lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.patient?.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#9E9E9E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.procedure?.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Paciente *</InputLabel>
                <Select value={form.patientId} label="Paciente *" onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                  {patients.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Procedimento *</InputLabel>
                <Select value={form.procedureId} label="Procedimento *" onChange={e => {
                  const proc = procedures.find(p => p.id === e.target.value);
                  setForm(f => ({ ...f, procedureId: e.target.value, durationMin: proc ? String(proc.durationMin) : f.durationMin }));
                }}>
                  {procedures.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Data e hora *" type="datetime-local" fullWidth value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Duração (min)" type="number" fullWidth value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))} />
            </Grid>
            {selected && (
              <Grid size={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={12}><TextField label="Observações" fullWidth multiline rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
