'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, Grid, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CursorClickIcon from '@mui/icons-material/AdsClickOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CampaignEditor } from './campaign-editor';

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [winners, setWinners] = useState<{ campaign: any; entries: any[] } | null>(null);

  const load = async () => { const r = await api.get('/campaigns'); setCampaigns(r.data); };
  useEffect(() => { load(); }, []);

  const openWinners = async (c: any) => {
    try {
      const r = await api.get(`/campaigns/${c.id}/entries`);
      setWinners({ campaign: c, entries: r.data });
    } catch { toast.error('Erro ao carregar ganhadores'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover campanha?')) return;
    await api.delete(`/campaigns/${id}`); toast.success('Campanha removida!'); load();
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://crm.carolinemaneira.com.br/p/${slug}`);
    toast.success('Link copiado!');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Campanhas</Typography>
          <Typography variant="body2">Crie landing pages para captar leads</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }}
          onClick={() => { setSelected(null); setEditorOpen(true); }}>
          Nova campanha
        </Button>
      </Box>

      {campaigns.length === 0 ? (
        <Box sx={{ py: 12, textAlign: 'center', border: '1px dashed #EDE8E8', borderRadius: '6px' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#6B6B6B' }}>Nenhuma campanha criada</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Crie landing pages personalizadas para captar leads pelo Google e Instagram
          </Typography>
          <Button variant="contained" sx={{ backgroundColor: '#A0585A' }} onClick={() => { setSelected(null); setEditorOpen(true); }}>
            Criar primeira campanha
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {campaigns.map(c => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <Box sx={{ height: 4, backgroundColor: c.primaryColor || '#A0585A' }} />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, flex: 1, pr: 1 }}>{c.title}</Typography>
                    <Chip label={c.active ? 'Ativa' : 'Inativa'} size="small" variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20, borderColor: c.active ? '#388E3C' : '#BDBDBD', color: c.active ? '#388E3C' : '#BDBDBD' }} />
                  </Box>
                  {c.campaignType === 'wheel' && (
                    <Chip icon={<CasinoOutlinedIcon sx={{ fontSize: '14px !important' }} />} label="Roleta de Prêmios" size="small"
                      sx={{ fontSize: '0.62rem', height: 20, mb: 1, backgroundColor: '#8E24AA15', color: '#8E24AA', '& .MuiChip-icon': { color: '#8E24AA' } }} />
                  )}
                  {c.campaignType === 'quiz' && (
                    <Chip icon={<QuizOutlinedIcon sx={{ fontSize: '14px !important' }} />} label="Quiz de Perfil" size="small"
                      sx={{ fontSize: '0.62rem', height: 20, mb: 1, backgroundColor: '#1565C015', color: '#1565C0', '& .MuiChip-icon': { color: '#1565C0' } }} />
                  )}
                  {c.subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.subtitle}</Typography>}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 14, color: '#BDBDBD' }} />
                      <Typography variant="caption" color="text.secondary">{c.views} views</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CursorClickIcon sx={{ fontSize: 14, color: '#BDBDBD' }} />
                      <Typography variant="caption" color="text.secondary">{c.clicks} cliques</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Button size="small" variant="outlined" startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => copyLink(c.slug)} sx={{ flex: 1, fontSize: '0.75rem', py: 0.5, borderColor: '#EDE8E8', color: '#6B6B6B' }}>
                      Copiar link
                    </Button>
                    <Tooltip title="Abrir landing page">
                      <IconButton size="small" component="a" href={`/p/${c.slug}`} target="_blank" sx={{ border: '1px solid #EDE8E8' }}>
                        <OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    {(c.campaignType === 'wheel' || c.campaignType === 'quiz') && (
                      <Tooltip title="Participantes / ganhadores">
                        <IconButton size="small" onClick={() => openWinners(c)} sx={{ border: '1px solid #EDE8E8', color: c.campaignType === 'quiz' ? '#1565C0' : '#8E24AA' }}>
                          <EmojiEventsOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => { setSelected(c); setEditorOpen(true); }} sx={{ border: '1px solid #EDE8E8' }}>
                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton size="small" onClick={() => remove(c.id)} sx={{ border: '1px solid #EDE8E8', color: '#D32F2F' }}>
                        <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Ganhadores da roleta */}
      <Dialog open={!!winners} onClose={() => setWinners(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Ganhadores · {winners?.campaign?.title}</DialogTitle>
        <DialogContent>
          {!winners?.entries?.length ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <EmojiEventsOutlinedIcon sx={{ fontSize: 40, color: '#E0D5D5' }} />
              <Typography variant="body2" sx={{ color: '#9A9A9A', mt: 1 }}>Nenhum participante ainda.</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: '#9A9A9A' }}>{winners.entries.length} participante(s) — cada um já virou lead no funil.</Typography>
              <List dense>
                {winners.entries.map((e: any) => (
                  <ListItem key={e.id} divider sx={{ px: 0 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {e.resultLabel && <Chip label={e.resultLabel} size="small" sx={{ backgroundColor: '#1565C015', color: '#1565C0', fontWeight: 600 }} />}
                        {e.prizeLabel && <Chip label={e.prizeLabel} size="small" sx={{ backgroundColor: '#8E24AA15', color: '#8E24AA', fontWeight: 600 }} />}
                      </Box>
                    }>
                    <ListItemText
                      primary={e.name}
                      secondary={[e.phone, e.email, e.instagram ? `@${e.instagram}` : null].filter(Boolean).join(' · ') + ' · ' + new Date(e.createdAt).toLocaleDateString('pt-BR')}
                      slotProps={{ primary: { style: { fontWeight: 600, fontSize: '0.875rem' } }, secondary: { style: { fontSize: '0.75rem' } } }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setWinners(null)}>Fechar</Button></DialogActions>
      </Dialog>

      <CampaignEditor open={editorOpen} onClose={() => { setEditorOpen(false); setSelected(null); load(); }} campaign={selected} />
    </Box>
  );
}
