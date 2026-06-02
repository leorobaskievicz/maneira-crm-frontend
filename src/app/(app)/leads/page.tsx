'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, Divider, IconButton, Tooltip,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';

const columns = [
  { key: 'new', label: 'Novo', color: '#1976D2' },
  { key: 'contacted', label: 'Contatado', color: '#F57C00' },
  { key: 'scheduled', label: 'Agendado', color: '#7B1FA2' },
  { key: 'converted', label: 'Convertido', color: '#388E3C' },
  { key: 'lost', label: 'Perdido', color: '#9E9E9E' },
];

const sourceLabels: Record<string, string> = {
  google: 'Google', instagram: 'Instagram', referral: 'Indicação',
  whatsapp: 'WhatsApp', walk_in: 'Presencial', other: 'Outro',
};

const PROCEDURES = ['Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster','Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação','Radiofrequência','PEIM','HIFU Corporal','Corrente Russa','Depilação a Laser','Ledterapia','Outro'];

const emptyForm = { name: '', phone: '', email: '', procedureInterest: '', source: 'other', notes: '', status: 'new' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => { const r = await api.get('/leads'); setLeads(r.data); };
  useEffect(() => { load(); }, []);

  const openDialog = (lead?: any) => {
    if (lead) { setSelected(lead); setForm({ name: lead.name, phone: lead.phone || '', email: lead.email || '', procedureInterest: lead.procedureInterest || '', source: lead.source, notes: lead.notes || '', status: lead.status }); }
    else { setSelected(null); setForm(emptyForm); }
    setOpen(true);
  };

  const save = async () => {
    try {
      if (selected) await api.put(`/leads/${selected.id}`, form);
      else await api.post('/leads', form);
      toast.success(selected ? 'Lead atualizado!' : 'Lead criado!');
      setOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const move = async (id: string, status: string) => {
    await api.put(`/leads/${id}`, { status });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover lead?')) return;
    await api.delete(`/leads/${id}`);
    toast.success('Removido!'); load();
  };

  const byStatus = (s: string) => leads.filter(l => l.status === s);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Leads</Typography>
          <Typography variant="body2">{leads.length} leads cadastrados</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => openDialog()}>
          Novo lead
        </Button>
      </Box>

      {/* Kanban */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {columns.map(col => (
          <Box key={col.key} sx={{ minWidth: 240, flex: '0 0 240px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
              <Typography variant="h6" sx={{ color: col.color }}>{col.label}</Typography>
              <Chip label={byStatus(col.key).length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto' }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {byStatus(col.key).map(lead => (
                <Card key={lead.id} sx={{ '&:hover': { borderColor: col.color + '55' } }}>
                  <CardContent sx={{ p: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{lead.name}</Typography>
                      <Box sx={{ display: 'flex', ml: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openDialog(lead)} sx={{ p: 0.25 }}>
                            <EditOutlinedIcon sx={{ fontSize: 14, color: '#BDBDBD' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" onClick={() => remove(lead.id)} sx={{ p: 0.25 }}>
                            <DeleteOutlinedIcon sx={{ fontSize: 14, color: '#BDBDBD' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {lead.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PhoneOutlinedIcon sx={{ fontSize: 11, color: '#BDBDBD' }} />
                        <Typography variant="caption">{lead.phone}</Typography>
                      </Box>
                    )}
                    {lead.procedureInterest && (
                      <Typography variant="caption" sx={{ color: '#A0585A', display: 'block', mt: 0.5 }}>
                        {lead.procedureInterest}
                      </Typography>
                    )}
                    <Chip label={sourceLabels[lead.source]} size="small" variant="outlined"
                      sx={{ height: 16, fontSize: '0.6rem', mt: 0.75, borderColor: '#EDE8E8', color: '#9E9E9E' }} />

                    {/* Mover */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {columns.filter(c => c.key !== col.key).map(c => (
                        <Chip key={c.key} label={`→ ${c.label}`} size="small" variant="outlined"
                          onClick={() => move(lead.id, c.key)}
                          sx={{ height: 18, fontSize: '0.6rem', cursor: 'pointer', borderColor: c.color + '44', color: c.color, '&:hover': { backgroundColor: c.color + '11' } }} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {byStatus(col.key).length === 0 && (
                <Box sx={{ border: '1px dashed #EDE8E8', borderRadius: '4px', p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#BDBDBD' }}>Nenhum lead</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField label="Nome *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Telefone" fullWidth value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Procedimento de interesse</InputLabel>
                <Select value={form.procedureInterest} label="Procedimento de interesse" onChange={e => setForm(f => ({ ...f, procedureInterest: e.target.value }))}>
                  {PROCEDURES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Origem</InputLabel>
                <Select value={form.source} label="Origem" onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  {Object.entries(sourceLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {columns.map(c => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
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
