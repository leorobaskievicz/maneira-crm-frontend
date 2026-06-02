'use client';
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';

const PROCEDURES = ['Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster','Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação','Radiofrequência','PEIM','HIFU Corporal','Corrente Russa','Depilação a Laser','Ledterapia','Intradermoterapia'];
const emptyForm = { title: '', subtitle: '', ctaType: 'whatsapp', ctaText: 'Agendar pelo WhatsApp', whatsappNumber: '41984443694', primaryColor: '#A0585A', procedures: [] as string[], active: true };

interface Props { open: boolean; onClose: () => void; campaign?: any; }

export function CampaignEditor({ open, onClose, campaign }: Props) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (campaign) setForm({ title: campaign.title, subtitle: campaign.subtitle || '', ctaType: campaign.ctaType, ctaText: campaign.ctaText || 'Agendar pelo WhatsApp', whatsappNumber: campaign.whatsappNumber || '41984443694', primaryColor: campaign.primaryColor || '#A0585A', procedures: campaign.procedures || [], active: campaign.active });
    else setForm(emptyForm);
  }, [campaign, open]);

  const addProc = (p: string) => { if (p && !form.procedures.includes(p)) setForm(f => ({ ...f, procedures: [...f.procedures, p] })); };
  const removeProc = (p: string) => setForm(f => ({ ...f, procedures: f.procedures.filter(x => x !== p) }));

  const save = async () => {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    try {
      if (campaign) await api.put(`/campaigns/${campaign.id}`, form);
      else await api.post('/campaigns', form);
      toast.success(campaign ? 'Campanha atualizada!' : 'Campanha criada!');
      onClose();
    } catch { toast.error('Erro ao salvar'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Formulário */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Título *" fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <TextField label="Subtítulo" fullWidth multiline rows={2} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />

              <Box>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel>Adicionar procedimento</InputLabel>
                  <Select value="" label="Adicionar procedimento" onChange={e => addProc(e.target.value)}>
                    {PROCEDURES.filter(p => !form.procedures.includes(p)).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {form.procedures.map(p => (
                    <Chip key={p} label={p} size="small" onDelete={() => removeProc(p)} variant="outlined"
                      sx={{ fontSize: '0.75rem', borderColor: '#A0585A55', color: '#A0585A' }} />
                  ))}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de CTA</InputLabel>
                    <Select value={form.ctaType} label="Tipo de CTA" onChange={e => setForm(f => ({ ...f, ctaType: e.target.value }))}>
                      <MenuItem value="whatsapp">Botão WhatsApp</MenuItem>
                      <MenuItem value="form">Formulário</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      style={{ width: 40, height: 40, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2 }} />
                    <TextField size="small" label="Cor" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} sx={{ flex: 1 }} />
                  </Box>
                </Grid>
              </Grid>

              {form.ctaType === 'whatsapp' && (
                <TextField label="Número WhatsApp (só dígitos)" fullWidth value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
              )}
              <TextField label="Texto do botão" fullWidth value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} />
            </Box>
          </Grid>

          {/* Preview */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Preview</Typography>
            <Box sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8', backgroundColor: '#111' }}>
              <Box sx={{ p: 2.5, textAlign: 'center', backgroundColor: form.primaryColor }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                  Clínica Caroline Maneira
                </Typography>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                  {form.title || 'Título da campanha'}
                </Typography>
                {form.subtitle && <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', mt: 0.75 }}>{form.subtitle}</Typography>}
              </Box>
              <Box sx={{ p: 2 }}>
                {form.procedures.slice(0, 3).map(p => (
                  <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: form.primaryColor, flexShrink: 0 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{p}</Typography>
                  </Box>
                ))}
                {form.procedures.length > 3 && <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>+{form.procedures.length - 3} mais</Typography>}
                <Box sx={{ mt: 1.5, py: 1.25, textAlign: 'center', borderRadius: '4px', backgroundColor: form.ctaType === 'whatsapp' ? '#25D366' : form.primaryColor }}>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                    {form.ctaType === 'whatsapp' ? '💬 ' : ''}{form.ctaText}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>
          {campaign ? 'Salvar alterações' : 'Criar campanha'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
