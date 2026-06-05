'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Card, CardContent, CardActionArea,
  Grid, Chip, Avatar, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Divider,
  CircularProgress, Tabs, Tab, List, ListItem, ListItemText,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import api from '@/lib/api';
import { MaskedTextField } from '@/components/form/MaskedTextField';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const emptyForm = { name: '', phone: '', email: '', birthDate: '', address: '', allergies: '', contraindications: '', notes: '' };

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [profileTab, setProfileTab] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);

  const load = useCallback(async (q = '') => {
    const res = await api.get('/patients', { params: q ? { search: q } : {} });
    setPatients(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (p?: any) => {
    if (p) {
      setSelected(p);
      setForm({ name: p.name, phone: p.phone || '', email: p.email || '', birthDate: p.birthDate?.split('T')[0] || '', address: p.address || '', allergies: p.allergies || '', contraindications: p.contraindications || '', notes: p.notes || '' });
    } else {
      setSelected(null);
      setForm(emptyForm);
    }
    setFormOpen(true);
  };

  const openProfile = async (p: any) => {
    setSelected(p);
    setProfileTab(0);
    setProfileOpen(true);
    setFinances([]);
    const res = await api.get(`/appointments/patient/${p.id}`).catch(() => ({ data: [] }));
    setAppointments(res.data);
    const fin = await api.get(`/financial/patient/${p.id}`).catch(() => ({ data: [] }));
    setFinances(fin.data);
  };

  const save = async () => {
    try {
      if (selected && formOpen) await api.put(`/patients/${selected.id}`, form);
      else await api.post('/patients', form);
      toast.success(selected ? 'Paciente atualizada!' : 'Paciente cadastrada!');
      setFormOpen(false); setProfileOpen(false); setSelected(null); load(search);
    } catch { toast.error('Erro ao salvar'); }
  };

  const paymentLabels: Record<string, string> = { cash: 'Dinheiro', pix: 'PIX', debit: 'Débito', credit: 'Crédito', installment: 'Parcelado' };
  const totalGasto = finances.reduce((s, f) => s + Number(f.received ?? f.amount ?? 0), 0);
  const totalPendente = finances.reduce((s, f) => s + Math.max(0, Number(f.amount || 0) - Number(f.received ?? f.amount ?? 0)), 0);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const filtered = patients.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Pacientes</Typography>
          <Typography variant="body2">{patients.length} cadastradas</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />}
          sx={{ backgroundColor: '#A0585A' }} onClick={() => openForm()}>
          Nova paciente
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={e => { setSearch(e.target.value); load(e.target.value); }}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" sx={{ color: '#BDBDBD' }} /></InputAdornment>,
          },
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: '#A0585A' }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(p => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ '&:hover': { borderColor: '#A0585A55' } }}>
                <CardActionArea onClick={() => openProfile(p)} sx={{ p: 0 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ width: 40, height: 40, backgroundColor: '#A0585A', fontSize: '0.9rem', fontWeight: 700 }}>
                        {getInitials(p.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>{p.name}</Typography>
                        <Chip label={p.active ? 'Ativa' : 'Inativa'} size="small" variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem', mt: 0.25, borderColor: p.active ? '#388E3C' : '#BDBDBD', color: p.active ? '#388E3C' : '#BDBDBD' }} />
                      </Box>
                    </Box>
                    {p.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <PhoneOutlinedIcon sx={{ fontSize: 13, color: '#BDBDBD' }} />
                        <Typography variant="body2">{p.phone}</Typography>
                      </Box>
                    )}
                    {p.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <EmailOutlinedIcon sx={{ fontSize: 13, color: '#BDBDBD' }} />
                        <Typography variant="body2" noWrap>{p.email}</Typography>
                      </Box>
                    )}
                    {p.tags?.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {p.tags.map((t: string) => (
                          <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#FAF0F0', color: '#A0585A' }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid size={12}>
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Nenhuma paciente encontrada</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Editar paciente' : 'Nova paciente'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField label="Nome *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><MaskedTextField mask="phone" label="Telefone" fullWidth value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Data de nascimento" type="date" fullWidth value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            <Grid size={12}><TextField type="email" label="Email" fullWidth value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Endereço" fullWidth value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Alergias" fullWidth multiline rows={2} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Contraindicações" fullWidth multiline rows={2} value={form.contraindications} onChange={e => setForm(f => ({ ...f, contraindications: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Observações" fullWidth multiline rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: '#A0585A', fontSize: '0.85rem' }}>
              {selected && getInitials(selected.name)}
            </Avatar>
            {selected?.name}
          </Box>
        </DialogTitle>
        <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} sx={{ px: 2, borderBottom: '1px solid #EDE8E8' }}>
          <Tab label="Dados" />
          <Tab label={`Histórico (${appointments.length})`} />
          <Tab label="Financeiro" />
        </Tabs>
        <DialogContent sx={{ p: 0 }}>
          {profileTab === 0 && (
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={12}><TextField label="Nome" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><MaskedTextField mask="phone" label="Telefone" fullWidth value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nascimento" type="date" fullWidth value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                <Grid size={12}><TextField type="email" label="Email" fullWidth value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Grid>
                <Grid size={12}><TextField label="Alergias" fullWidth multiline rows={2} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} /></Grid>
                <Grid size={12}><TextField label="Observações" fullWidth multiline rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Grid>
              </Grid>
            </Box>
          )}
          {profileTab === 1 && (
            <List disablePadding>
              {appointments.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Nenhum atendimento</Typography>
                </Box>
              )}
              {appointments.map((a, i) => (
                <ListItem key={a.id} divider={i < appointments.length - 1} sx={{ px: 2.5 }}>
                  <ListItemText
                    primary={a.procedure?.name}
                    secondary={format(parseISO(a.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  />
                  <Chip label={statusLabels[a.status]} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </ListItem>
              ))}
            </List>
          )}
          {profileTab === 2 && (
            <Box sx={{ p: 2.5 }}>
              <Card sx={{ backgroundColor: '#A0585A', mb: 2 }}>
                <CardContent sx={{ textAlign: 'center', '&:last-child': { pb: '16px !important' } }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total recebido</Typography>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#fff', mt: 0.5 }}>{fmt(totalGasto)}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {finances.length} {finances.length === 1 ? 'venda' : 'vendas'}
                    {totalPendente > 0.001 ? ` · ${fmt(totalPendente)} a receber` : ''}
                  </Typography>
                </CardContent>
              </Card>
              {finances.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Nenhum lançamento financeiro</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {finances.map((f, i) => {
                    const amount = Number(f.amount || 0);
                    const rec = Number(f.received ?? amount);
                    const pend = Math.max(0, amount - rec);
                    return (
                      <ListItem key={f.id} divider={i < finances.length - 1} sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={f.description || (f.items?.map((it: any) => it.name).join(', ')) || 'Atendimento'}
                          secondary={`${format(parseISO(f.createdAt), 'dd/MM/yyyy', { locale: ptBR })} · ${paymentLabels[f.paymentMethod] || f.paymentMethod}`}
                          slotProps={{ primary: { style: { fontSize: '0.875rem', fontWeight: 600 } }, secondary: { style: { fontSize: '0.78rem' } } }}
                        />
                        <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>{fmt(amount)}</Typography>
                          {pend > 0.001
                            ? <Typography sx={{ fontSize: '0.7rem', color: '#D32F2F' }}>{fmt(pend)} pendente</Typography>
                            : <Typography sx={{ fontSize: '0.7rem', color: '#388E3C' }}>pago</Typography>}
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Fechar</Button>
          {profileTab === 0 && (
            <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar dados</Button>
          )}
          <Button variant="outlined" onClick={() => { setProfileOpen(false); openForm(selected); }}>
            Editar completo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
