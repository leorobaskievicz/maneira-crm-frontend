'use client';
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip,
  ToggleButtonGroup, ToggleButton, Switch, FormControlLabel, IconButton, Divider, Tooltip,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MaskedTextField } from '@/components/form/MaskedTextField';
import { PrizeWheel } from '@/components/PrizeWheel';
import { uploadImage } from '@/lib/upload';

const PROCEDURES = ['Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster','Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação','Radiofrequência','PEIM','HIFU Corporal','Corrente Russa','Depilação a Laser','Ledterapia','Intradermoterapia'];
const SLOT_PALETTE = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#FDD835', '#6D4C41'];

const defaultWheel = () => ({
  theme: '',
  backgroundImage: '',
  secondaryColor: '#1A1A1A',
  backgroundColor: '#0d0d0d',
  ctaBgColor: '#A0585A',
  ctaTextColor: '#ffffff',
  spinDurationMs: 5000,
  successTitle: 'Parabéns! 🎉',
  successMessage: 'Você ganhou:',
  scheduleMessage: 'Quero agendar minha avaliação e resgatar meu prêmio',
  onePerPerson: true,
  slots: [
    { label: '10% OFF', color: '#E53935', weight: 40 },
    { label: 'Brinde exclusivo', color: '#1E88E5', weight: 30 },
    { label: 'Avaliação grátis', color: '#43A047', weight: 20 },
    { label: 'Limpeza de pele', color: '#FB8C00', weight: 10 },
  ],
});

const emptyForm = () => ({
  title: '', subtitle: '', campaignType: 'landing',
  ctaType: 'whatsapp', ctaText: 'Agendar pelo WhatsApp',
  whatsappNumber: '41984443694', primaryColor: '#A0585A',
  procedures: [] as string[], active: true,
  wheelConfig: defaultWheel(),
});

interface Props { open: boolean; onClose: () => void; campaign?: any; }

export function CampaignEditor({ open, onClose, campaign }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    if (campaign) {
      setForm({
        title: campaign.title, subtitle: campaign.subtitle || '',
        campaignType: campaign.campaignType || 'landing',
        ctaType: campaign.ctaType || 'whatsapp', ctaText: campaign.ctaText || 'Agendar pelo WhatsApp',
        whatsappNumber: campaign.whatsappNumber || '41984443694', primaryColor: campaign.primaryColor || '#A0585A',
        procedures: campaign.procedures || [], active: campaign.active,
        wheelConfig: { ...defaultWheel(), ...(campaign.wheelConfig || {}) },
      });
    } else setForm(emptyForm());
  }, [campaign, open]);

  const isWheel = form.campaignType === 'wheel';
  const wheel = form.wheelConfig;
  const setWheel = (patch: any) => setForm((f) => ({ ...f, wheelConfig: { ...f.wheelConfig, ...patch } }));

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const url = await uploadImage(file);
      setWheel({ backgroundImage: url });
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingBg(false);
      e.target.value = '';
    }
  };

  const addProc = (p: string) => { if (p && !form.procedures.includes(p)) setForm(f => ({ ...f, procedures: [...f.procedures, p] })); };
  const removeProc = (p: string) => setForm(f => ({ ...f, procedures: f.procedures.filter(x => x !== p) }));

  // Slots
  const updateSlot = (i: number, patch: any) => setWheel({ slots: wheel.slots.map((s: any, idx: number) => idx === i ? { ...s, ...patch } : s) });
  const addSlot = () => setWheel({ slots: [...wheel.slots, { label: 'Novo prêmio', color: SLOT_PALETTE[wheel.slots.length % SLOT_PALETTE.length], weight: 10 }] });
  const removeSlot = (i: number) => { if (wheel.slots.length <= 2) return toast.error('A roleta precisa de pelo menos 2 prêmios'); setWheel({ slots: wheel.slots.filter((_: any, idx: number) => idx !== i) }); };
  const totalWeight = wheel.slots.reduce((s: number, x: any) => s + (Number(x.weight) || 0), 0) || 1;

  const save = async () => {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    if (isWheel && wheel.slots.length < 2) { toast.error('Configure ao menos 2 prêmios'); return; }
    const payload = { ...form, wheelConfig: isWheel ? wheel : null };
    try {
      if (campaign) await api.put(`/campaigns/${campaign.id}`, payload);
      else await api.post('/campaigns', payload);
      toast.success(campaign ? 'Campanha atualizada!' : 'Campanha criada!');
      onClose();
    } catch { toast.error('Erro ao salvar'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
      <DialogContent>
        {/* Tipo de campanha */}
        <ToggleButtonGroup
          exclusive value={form.campaignType}
          onChange={(_, v) => v && setForm(f => ({ ...f, campaignType: v }))}
          fullWidth sx={{ mt: 1, mb: 2 }}
        >
          <ToggleButton value="landing" sx={{ gap: 1, py: 1.25 }}><CampaignOutlinedIcon fontSize="small" /> Landing Page</ToggleButton>
          <ToggleButton value="wheel" sx={{ gap: 1, py: 1.25 }}><CasinoOutlinedIcon fontSize="small" /> Roleta de Prêmios</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={3}>
          {/* Coluna esquerda — formulário */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Título *" fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <TextField label="Subtítulo" fullWidth multiline rows={2} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />

              <Grid container spacing={2}>
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      style={{ width: 40, height: 40, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2 }} />
                    <TextField size="small" label="Cor principal" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} sx={{ flex: 1 }} />
                  </Box>
                </Grid>
                <Grid size={6}>
                  <MaskedTextField mask="phone" label="WhatsApp da clínica" fullWidth value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
                </Grid>
              </Grid>

              {!isWheel && (
                <>
                  <Box>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Adicionar procedimento</InputLabel>
                      <Select value="" label="Adicionar procedimento" onChange={e => addProc(e.target.value)}>
                        {PROCEDURES.filter(p => !form.procedures.includes(p)).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {form.procedures.map(p => (
                        <Chip key={p} label={p} size="small" onDelete={() => removeProc(p)} variant="outlined" sx={{ fontSize: '0.75rem', borderColor: '#A0585A55', color: '#A0585A' }} />
                      ))}
                    </Box>
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de CTA</InputLabel>
                    <Select value={form.ctaType} label="Tipo de CTA" onChange={e => setForm(f => ({ ...f, ctaType: e.target.value }))}>
                      <MenuItem value="whatsapp">Botão WhatsApp</MenuItem>
                      <MenuItem value="form">Formulário</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Texto do botão" fullWidth value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} />
                </>
              )}

              {isWheel && (
                <>
                  <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>CONFIGURAÇÃO DA ROLETA</Typography></Divider>
                  <Grid container spacing={2}>
                    <Grid size={6}><TextField label="Tema (ex: Copa do Mundo)" fullWidth size="small" value={wheel.theme} onChange={e => setWheel({ theme: e.target.value })} /></Grid>
                    <Grid size={6}><TextField label="Tempo de giro (ms)" type="number" fullWidth size="small" value={wheel.spinDurationMs} onChange={e => setWheel({ spinDurationMs: Number(e.target.value) })} /></Grid>
                  </Grid>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B' }}>Imagem de fundo (tema)</Typography>
                    {wheel.backgroundImage ? (
                      <Box sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8' }}>
                        <Box component="img" src={wheel.backgroundImage} alt="Fundo" sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                        <Tooltip title="Remover imagem">
                          <IconButton size="small" onClick={() => setWheel({ backgroundImage: '' })}
                            sx={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' } }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button component="label" variant="outlined" fullWidth disabled={uploadingBg}
                        startIcon={<CloudUploadOutlinedIcon />}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', '&:hover': { borderColor: '#A0585A', color: '#A0585A' } }}>
                        {uploadingBg ? 'Enviando…' : 'Selecionar imagem'}
                        <input hidden type="file" accept="image/*" onChange={handleBgUpload} />
                      </Button>
                    )}
                  </Box>

                  {/* Cores da landing */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: '#6B6B6B', fontWeight: 600 }}>Cores</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <ColorBox label="Secundária" value={wheel.secondaryColor} onChange={(v) => setWheel({ secondaryColor: v })} />
                      <ColorBox label="Fundo" value={wheel.backgroundColor} onChange={(v) => setWheel({ backgroundColor: v })} />
                      <ColorBox label="CTA · fundo" value={wheel.ctaBgColor} onChange={(v) => setWheel({ ctaBgColor: v })} />
                      <ColorBox label="CTA · texto" value={wheel.ctaTextColor} onChange={(v) => setWheel({ ctaTextColor: v })} />
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={6}><TextField label="Título da conclusão" fullWidth size="small" value={wheel.successTitle} onChange={e => setWheel({ successTitle: e.target.value })} /></Grid>
                    <Grid size={6}><TextField label="Mensagem da conclusão" fullWidth size="small" value={wheel.successMessage} onChange={e => setWheel({ successMessage: e.target.value })} /></Grid>
                  </Grid>
                  <TextField label="Mensagem do WhatsApp (agendar)" fullWidth size="small" value={wheel.scheduleMessage} onChange={e => setWheel({ scheduleMessage: e.target.value })} />
                  <FormControlLabel
                    control={<Switch checked={!!wheel.onePerPerson} onChange={e => setWheel({ onePerPerson: e.target.checked })} />}
                    label={<Typography variant="body2">Permitir apenas 1 giro por WhatsApp</Typography>}
                  />

                  {/* Editor de prêmios */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Prêmios ({wheel.slots.length})</Typography>
                      <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addSlot} sx={{ color: '#A0585A' }}>Adicionar</Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {wheel.slots.map((slot: any, i: number) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input type="color" value={slot.color} onChange={e => updateSlot(i, { color: e.target.value })}
                            style={{ width: 34, height: 34, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2, flexShrink: 0 }} />
                          <TextField size="small" placeholder="Prêmio" value={slot.label} onChange={e => updateSlot(i, { label: e.target.value })} sx={{ flex: 1 }} />
                          <TextField size="small" type="number" label="Peso" value={slot.weight} onChange={e => updateSlot(i, { weight: Number(e.target.value) })} sx={{ width: 88 }} />
                          <Typography variant="caption" sx={{ width: 38, color: '#9A9A9A', textAlign: 'right' }}>
                            {Math.round(((Number(slot.weight) || 0) / totalWeight) * 100)}%
                          </Typography>
                          <IconButton size="small" onClick={() => removeSlot(i)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#9A9A9A', mt: 1, display: 'block' }}>
                      O “peso” define a chance de cada prêmio sair. Quanto maior, mais provável.
                    </Typography>
                  </Box>
                </>
              )}

              <FormControlLabel
                control={<Switch checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />}
                label={<Typography variant="body2">Campanha ativa</Typography>}
              />
            </Box>
          </Grid>

          {/* Coluna direita — preview */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Preview</Typography>
            {isWheel ? (
              <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #EDE8E8', p: 2, textAlign: 'center',
                background: wheel.backgroundImage
                  ? `linear-gradient(180deg, ${wheel.backgroundColor}CC, ${wheel.backgroundColor}F2), url(${wheel.backgroundImage})`
                  : `linear-gradient(165deg, ${form.primaryColor} 0%, ${wheel.secondaryColor} 55%, ${wheel.backgroundColor} 100%)`,
                backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {wheel.theme && <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{wheel.theme}</Typography>}
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', mb: 1.5 }}>{form.title || 'Título'}</Typography>
                <PrizeWheel slots={wheel.slots} targetIndex={null} size={230} />
                <Box sx={{ mt: 2, py: 1, borderRadius: '8px', backgroundColor: wheel.ctaBgColor }}>
                  <Typography sx={{ color: wheel.ctaTextColor, fontWeight: 800, fontSize: '0.85rem' }}>🎯 GIRAR A ROLETA</Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8', backgroundColor: '#111' }}>
                <Box sx={{ p: 2.5, textAlign: 'center', backgroundColor: form.primaryColor }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>Clínica Caroline Maneira</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{form.title || 'Título da campanha'}</Typography>
                  {form.subtitle && <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', mt: 0.75 }}>{form.subtitle}</Typography>}
                </Box>
                <Box sx={{ p: 2 }}>
                  {form.procedures.slice(0, 3).map(p => (
                    <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: form.primaryColor, flexShrink: 0 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{p}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 1.5, py: 1.25, textAlign: 'center', borderRadius: '4px', backgroundColor: form.ctaType === 'whatsapp' ? '#25D366' : form.primaryColor }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{form.ctaType === 'whatsapp' ? '💬 ' : ''}{form.ctaText}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
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

function ColorBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 32, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: '#6B6B6B' }}>{label}</Typography>
    </Box>
  );
}
