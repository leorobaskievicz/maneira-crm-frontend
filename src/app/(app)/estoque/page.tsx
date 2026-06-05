'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, LinearProgress, Alert,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movOpen, setMovOpen] = useState(false);
  const [movType, setMovType] = useState<'in' | 'out'>('in');
  const [selected, setSelected] = useState<any>(null);
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');

  const load = async () => { const r = await api.get('/products'); setProducts(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const isLow = (p: any) => Number(p.quantity) <= Number(p.minQuantity);
  const pct = (p: any) => Math.min(100, (Number(p.quantity) / Math.max(Number(p.minQuantity) * 2, 1)) * 100);

  const openMov = (p: any, type: 'in' | 'out') => {
    setSelected(p); setMovType(type); setQty('1'); setReason('');
    setMovOpen(true);
  };

  const saveMov = async () => {
    try {
      await api.post('/stock-movements', { product: { id: selected.id }, type: movType, quantity: +qty, reason });
      toast.success(movType === 'in' ? 'Entrada registrada!' : 'Saída registrada!');
      setMovOpen(false); load();
    } catch { toast.error('Erro ao registrar'); }
  };

  const lowCount = products.filter(isLow).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Estoque</Typography>
          <Typography variant="body2">{products.length} produtos cadastrados</Typography>
        </Box>
      </Box>

      {lowCount > 0 && (
        <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ mb: 3, borderRadius: '4px' }}>
          {lowCount} produto{lowCount > 1 ? 's' : ''} com estoque abaixo do mínimo
        </Alert>
      )}

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1, backgroundColor: '#EDE8E8', '& .MuiLinearProgress-bar': { backgroundColor: '#A0585A' } }} />
      ) : products.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <InventoryOutlinedIcon sx={{ fontSize: 48, color: '#BDBDBD', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">Nenhum produto cadastrado</Typography>
          <Typography variant="caption" color="text.secondary">Adicione produtos em Configurações → Produtos</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map(p => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ borderColor: isLow(p) ? '#F57C00' : undefined }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</Typography>
                      {p.brand && <Typography variant="caption" color="text.secondary">{p.brand}</Typography>}
                    </Box>
                    {isLow(p) && (
                      <Chip icon={<WarningAmberOutlinedIcon sx={{ fontSize: '14px !important' }} />} label="Baixo"
                        size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.75 }}>
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: isLow(p) ? '#F57C00' : '#1A1A1A', lineHeight: 1 }}>
                      {Number(p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{p.unit}</Typography>
                  </Box>

                  <LinearProgress variant="determinate" value={pct(p)}
                    sx={{ mb: 0.75, borderRadius: 1, height: 4, backgroundColor: '#F0ECEC', '& .MuiLinearProgress-bar': { backgroundColor: isLow(p) ? '#F57C00' : '#A0585A', borderRadius: 1 } }} />

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Mínimo: {p.minQuantity} {p.unit}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<AddOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => openMov(p, 'in')} fullWidth
                      sx={{ borderColor: '#388E3C', color: '#388E3C', '&:hover': { borderColor: '#388E3C', backgroundColor: '#388E3C11' }, fontSize: '0.75rem', py: 0.5 }}>
                      Entrada
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<RemoveOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => openMov(p, 'out')} fullWidth
                      sx={{ borderColor: '#D32F2F', color: '#D32F2F', '&:hover': { borderColor: '#D32F2F', backgroundColor: '#D32F2F11' }, fontSize: '0.75rem', py: 0.5 }}>
                      Saída
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={movOpen} onClose={() => setMovOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: movType === 'in' ? '#388E3C' : '#D32F2F' }}>
          {movType === 'in' ? '+ Entrada de Estoque' : '− Saída de Estoque'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selected?.name}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={`Quantidade (${selected?.unit})`} type="number" fullWidth value={qty}
              onChange={e => setQty(e.target.value)} slotProps={{ htmlInput: { min: 0.001, step: 0.001 } }} />
            <TextField label="Motivo" fullWidth multiline rows={2} value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={movType === 'in' ? 'Ex: Compra de fornecedor' : 'Ex: Usado no atendimento'} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveMov}
            sx={{ backgroundColor: movType === 'in' ? '#388E3C' : '#D32F2F' }}>
            Confirmar {movType === 'in' ? 'Entrada' : 'Saída'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
