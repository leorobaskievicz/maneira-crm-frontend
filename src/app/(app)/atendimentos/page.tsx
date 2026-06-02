'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, Grid, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Avatar, InputAdornment, List, ListItem,
  ListItemText, IconButton, Tooltip, Divider,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AtendimentosPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<{ productId: string; productName: string; quantity: number }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selProduct, setSelProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [payDialog, setPayDialog] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'pix' });

  const load = async () => {
    const r = await api.get('/appointments');
    setAppointments(r.data.filter((a: any) => ['scheduled', 'confirmed', 'in_progress'].includes(a.status)));
  };

  useEffect(() => { load(); api.get('/products').then(r => setAllProducts(r.data)); }, []);

  const openRecord = async (apt: any) => {
    setSelected(apt);
    setNotes(''); setProducts([]);
    setPayForm({ amount: String(apt.procedure?.price || ''), paymentMethod: 'pix' });
    try {
      const r = await api.get(`/medical-records/patient/${apt.patient?.id}`);
      const ex = r.data.find((rec: any) => rec.appointment?.id === apt.id);
      if (ex) { setNotes(ex.notes || ''); setProducts(ex.productsUsed || []); }
    } catch {}
    setOpen(true);
  };

  const addProduct = () => {
    const p = allProducts.find(x => x.id === selProduct);
    if (!p) return;
    setProducts(prev => [...prev, { productId: p.id, productName: p.name, quantity: +qty }]);
    setSelProduct(''); setQty('1');
  };

  const saveRecord = async () => {
    try {
      await api.post('/medical-records', { appointment: { id: selected.id }, patient: { id: selected.patient?.id }, notes, productsUsed: products });
      await api.put(`/appointments/${selected.id}`, { status: 'completed' });
      toast.success('Atendimento registrado!');
      setOpen(false);
      setPayDialog(true);
    } catch { toast.error('Erro ao salvar'); }
  };

  const savePay = async () => {
    try {
      await api.post('/financial', { ...payForm, amount: +payForm.amount, appointment: { id: selected.id }, patient: { id: selected.patient?.id }, description: selected.procedure?.name, status: 'paid' });
      toast.success('Pagamento registrado!');
      setPayDialog(false); load();
    } catch { toast.error('Erro ao registrar pagamento'); }
  };

  const filtered = appointments.filter(a => !search || a.patient?.name?.toLowerCase().includes(search.toLowerCase()));

  const statusColors: Record<string, string> = { scheduled: '#1976D2', confirmed: '#388E3C', in_progress: '#F57C00' };
  const statusLabels: Record<string, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento' };
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Atendimentos</Typography>
        <Typography variant="body2">Registre os procedimentos realizados</Typography>
      </Box>

      <TextField fullWidth placeholder="Buscar paciente..."
        value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 3 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" sx={{ color: '#BDBDBD' }} /></InputAdornment> } }} />

      {filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <AssignmentOutlinedIcon sx={{ fontSize: 48, color: '#BDBDBD', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">Nenhum atendimento pendente 🌸</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map(apt => (
            <Card key={apt.id} sx={{ '&:hover': { borderColor: '#A0585A55' } }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 42, height: 42, backgroundColor: '#A0585A', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                  {apt.patient?.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{apt.patient?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{apt.procedure?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(apt.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })} · {apt.durationMin}min · {fmt(apt.procedure?.price || 0)}
                  </Typography>
                </Box>
                <Chip label={statusLabels[apt.status]} size="small" variant="outlined"
                  sx={{ borderColor: statusColors[apt.status], color: statusColors[apt.status], fontSize: '0.7rem' }} />
                <Button variant="contained" size="small" startIcon={<AssignmentOutlinedIcon />}
                  onClick={() => openRecord(apt)} sx={{ backgroundColor: '#A0585A', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Registrar
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Dialog prontuário */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Prontuário — {selected?.patient?.name}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {selected?.procedure?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField label="Observações do atendimento" fullWidth multiline rows={4} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Descreva o procedimento realizado, recomendações pós-procedimento..." />

            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Produtos utilizados</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Produto</InputLabel>
                  <Select value={selProduct} label="Produto" onChange={e => setSelProduct(e.target.value)}>
                    {allProducts.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="number" value={qty} onChange={e => setQty(e.target.value)} sx={{ width: 80 }} slotProps={{ htmlInput: { min: 0.001, step: 0.001 } }} />
                <Button variant="outlined" onClick={addProduct} sx={{ borderColor: '#EDE8E8', minWidth: 40, px: 1 }}>
                  <AddOutlinedIcon fontSize="small" />
                </Button>
              </Box>
              {products.length > 0 && (
                <List dense disablePadding sx={{ border: '1px solid #EDE8E8', borderRadius: '4px' }}>
                  {products.map((p, i) => (
                    <ListItem key={i} divider={i < products.length - 1}
                      secondaryAction={<IconButton edge="end" size="small" onClick={() => setProducts(prev => prev.filter((_, j) => j !== i))}><DeleteOutlinedIcon fontSize="small" sx={{ color: '#BDBDBD' }} /></IconButton>}>
                      <ListItemText primary={p.productName} secondary={`${p.quantity} unid.`}
                        slotProps={{ primary: { style: { fontSize: '0.875rem' } }, secondary: { style: { fontSize: '0.8rem' } } }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveRecord} sx={{ backgroundColor: '#A0585A' }}>
            Salvar e Concluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pagamento */}
      <Dialog open={payDialog} onClose={() => { setPayDialog(false); load(); }} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar Pagamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deseja registrar o pagamento de {selected?.patient?.name}?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Valor (R$)" type="number" fullWidth value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            <FormControl size="small">
              <InputLabel>Forma de pagamento</InputLabel>
              <Select value={payForm.paymentMethod} label="Forma de pagamento" onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {[['cash','Dinheiro'],['pix','PIX'],['debit','Débito'],['credit','Crédito'],['installment','Parcelado']].map(([k,v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPayDialog(false); load(); }}>Pular</Button>
          <Button variant="contained" onClick={savePay} sx={{ backgroundColor: '#A0585A' }}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
