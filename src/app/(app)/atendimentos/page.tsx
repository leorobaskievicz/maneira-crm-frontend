'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Avatar, InputAdornment, List, ListItem,
  ListItemText, IconButton, Divider, Tooltip,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SaleItem { type: 'procedure' | 'product' | 'other'; name: string; quantity: number; unitPrice: number }

const PAYMENT_METHODS = [['cash', 'Dinheiro'], ['pix', 'PIX'], ['debit', 'Débito'], ['credit', 'Crédito'], ['installment', 'Parcelado']];

export default function AtendimentosPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // Prontuário
  const [notes, setNotes] = useState('');
  const [productsUsed, setProductsUsed] = useState<{ productId: string; productName: string; quantity: number }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selProduct, setSelProduct] = useState('');
  const [prodQty, setProdQty] = useState('1');

  // Venda
  const [allProcedures, setAllProcedures] = useState<any[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [addProc, setAddProc] = useState('');
  const [discount, setDiscount] = useState('0');
  const [received, setReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const load = async () => {
    const r = await api.get('/appointments');
    setAppointments(r.data.filter((a: any) => ['scheduled', 'confirmed', 'in_progress'].includes(a.status)));
  };

  useEffect(() => {
    load();
    api.get('/products').then(r => setAllProducts(r.data)).catch(() => {});
    api.get('/procedures-catalog').then(r => setAllProcedures(r.data)).catch(() => {});
  }, []);

  const openRecord = async (apt: any) => {
    setSelected(apt);
    setNotes('');
    setProductsUsed([]);
    setDiscount('0');
    setPaymentMethod('pix');
    // Item inicial = procedimento do agendamento
    const initialItems: SaleItem[] = apt.procedure
      ? [{ type: 'procedure', name: apt.procedure.name, quantity: 1, unitPrice: Number(apt.procedure.price) || 0 }]
      : [];
    setItems(initialItems);
    setReceived(String(initialItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0) || ''));
    try {
      const r = await api.get(`/medical-records/patient/${apt.patient?.id}`);
      const ex = r.data.find((rec: any) => rec.appointment?.id === apt.id);
      if (ex) { setNotes(ex.notes || ''); setProductsUsed(ex.productsUsed || []); }
    } catch {}
    setOpen(true);
  };

  // Itens da venda
  const addProcedure = (id: string) => {
    const p = allProcedures.find(x => x.id === id);
    if (!p) return;
    setItems(prev => [...prev, { type: 'procedure', name: p.name, quantity: 1, unitPrice: Number(p.price) || 0 }]);
    setAddProc('');
  };
  const addCustomItem = () => setItems(prev => [...prev, { type: 'other', name: '', quantity: 1, unitPrice: 0 }]);
  const updateItem = (i: number, patch: Partial<SaleItem>) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  // Produtos utilizados (consumo clínico / estoque)
  const addProductUsed = () => {
    const p = allProducts.find(x => x.id === selProduct);
    if (!p) return;
    setProductsUsed(prev => [...prev, { productId: p.id, productName: p.name, quantity: +prodQty }]);
    setSelProduct(''); setProdQty('1');
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const receivedNum = received === '' ? 0 : Number(received) || 0;
  const balance = total - receivedNum;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // 1) Prontuário
      await api.post('/medical-records', {
        appointment: { id: selected.id },
        patient: { id: selected.patient?.id },
        notes,
        productsUsed,
      });
      // 2) Conclui atendimento
      await api.put(`/appointments/${selected.id}`, { status: 'completed' });
      // 3) Venda / financeiro (se houver valor)
      if (total > 0) {
        await api.post('/financial', {
          amount: total,
          received: receivedNum,
          paymentMethod,
          status: receivedNum >= total ? 'paid' : 'pending',
          items,
          description: items.map(it => it.name).filter(Boolean).join(', ') || selected.procedure?.name,
          appointment: { id: selected.id },
          patient: { id: selected.patient?.id },
        });
      }
      toast.success('Atendimento registrado!');
      setOpen(false);
      load();
    } catch {
      toast.error('Erro ao registrar atendimento');
    } finally {
      setSaving(false);
    }
  };

  const filtered = appointments.filter(a => !search || a.patient?.name?.toLowerCase().includes(search.toLowerCase()));
  const statusColors: Record<string, string> = { scheduled: '#1976D2', confirmed: '#388E3C', in_progress: '#F57C00' };
  const statusLabels: Record<string, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento' };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Atendimentos</Typography>
        <Typography variant="body2">Registre o procedimento, a venda e o pagamento</Typography>
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

      {/* Dialog registro de venda */}
      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Registrar atendimento — {selected?.patient?.name}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {selected && format(parseISO(selected.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

            {/* ===== Itens da venda ===== */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <MedicalServicesOutlinedIcon fontSize="small" sx={{ color: '#A0585A' }} />
                <Typography variant="h6">Itens (procedimentos / produtos)</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: 220 }}>
                  <InputLabel>Adicionar procedimento</InputLabel>
                  <Select value={addProc} label="Adicionar procedimento" onChange={e => addProcedure(e.target.value)}>
                    {allProcedures.map(p => <MenuItem key={p.id} value={p.id}>{p.name} — {fmt(Number(p.price))}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={addCustomItem} sx={{ borderColor: '#EDE8E8', color: '#6B6B6B', whiteSpace: 'nowrap' }}>
                  Item avulso
                </Button>
              </Box>

              {items.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#BDBDBD', textAlign: 'center', py: 2, border: '1px dashed #EDE8E8', borderRadius: '8px' }}>
                  Nenhum item. Adicione um procedimento ou item avulso.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {items.map((it, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField size="small" placeholder="Descrição" value={it.name} onChange={e => updateItem(i, { name: e.target.value })} sx={{ flex: 1 }} />
                      <TextField size="small" label="Qtd" type="number" value={it.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} sx={{ width: 72 }} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
                      <TextField size="small" label="Valor unit." type="number" value={it.unitPrice} onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })} sx={{ width: 120 }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }} />
                      <Typography sx={{ width: 96, textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>{fmt((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}</Typography>
                      <IconButton size="small" onClick={() => removeItem(i)}><DeleteOutlinedIcon fontSize="small" sx={{ color: '#BDBDBD' }} /></IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Divider />

            {/* ===== Pagamento ===== */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Pagamento</Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField size="small" label="Desconto (R$)" type="number" value={discount} onChange={e => setDiscount(e.target.value)} fullWidth slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField size="small" label="Valor recebido (R$)" type="number" value={received} onChange={e => setReceived(e.target.value)} fullWidth slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                    <Tooltip title="Receber valor total">
                      <Button variant="outlined" onClick={() => setReceived(String(total))} sx={{ borderColor: '#EDE8E8', color: '#6B6B6B', whiteSpace: 'nowrap', px: 1.5 }}>= Total</Button>
                    </Tooltip>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Forma de pagamento</InputLabel>
                    <Select value={paymentMethod} label="Forma de pagamento" onChange={e => setPaymentMethod(e.target.value)}>
                      {PAYMENT_METHODS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1, minWidth: 220, backgroundColor: '#F7F5F5', borderRadius: '8px', p: 2 }}>
                  <Row label="Subtotal" value={fmt(subtotal)} />
                  {Number(discount) > 0 && <Row label="Desconto" value={`- ${fmt(Number(discount))}`} />}
                  <Divider sx={{ my: 1 }} />
                  <Row label="Total" value={fmt(total)} strong />
                  <Row label="Recebido" value={fmt(receivedNum)} color="#388E3C" />
                  {balance > 0.001 && <Row label="Falta receber" value={fmt(balance)} color="#D32F2F" />}
                  {balance <= 0.001 && total > 0 && <Typography sx={{ fontSize: '0.75rem', color: '#388E3C', fontWeight: 600, mt: 0.5 }}>✓ Pago integralmente</Typography>}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* ===== Prontuário ===== */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Prontuário</Typography>
              <TextField label="Observações do atendimento" fullWidth multiline rows={3} value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Procedimento realizado, recomendações pós-procedimento..." sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Inventory2OutlinedIcon fontSize="small" sx={{ color: '#9E9E9E' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Produtos utilizados (consumo)</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Produto</InputLabel>
                  <Select value={selProduct} label="Produto" onChange={e => setSelProduct(e.target.value)}>
                    {allProducts.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="number" value={prodQty} onChange={e => setProdQty(e.target.value)} sx={{ width: 80 }} slotProps={{ htmlInput: { min: 0.001, step: 0.001 } }} />
                <Button variant="outlined" onClick={addProductUsed} sx={{ borderColor: '#EDE8E8', minWidth: 40, px: 1 }}><AddOutlinedIcon fontSize="small" /></Button>
              </Box>
              {productsUsed.length > 0 && (
                <List dense disablePadding sx={{ border: '1px solid #EDE8E8', borderRadius: '4px' }}>
                  {productsUsed.map((p, i) => (
                    <ListItem key={i} divider={i < productsUsed.length - 1}
                      secondaryAction={<IconButton edge="end" size="small" onClick={() => setProductsUsed(prev => prev.filter((_, j) => j !== i))}><DeleteOutlinedIcon fontSize="small" sx={{ color: '#BDBDBD' }} /></IconButton>}>
                      <ListItemText primary={p.productName} secondary={`${p.quantity} unid.`}
                        slotProps={{ primary: { style: { fontSize: '0.875rem' } }, secondary: { style: { fontSize: '0.8rem' } } }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ pl: 1, fontWeight: 700, color: '#1A1A1A' }}>Total: {fmt(total)}</Typography>
          <Box>
            <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={save} disabled={saving} sx={{ backgroundColor: '#A0585A' }}>
              {saving ? 'Salvando…' : 'Salvar atendimento'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.25 }}>
      <Typography sx={{ fontSize: strong ? '0.9rem' : '0.8rem', color: '#6B6B6B', fontWeight: strong ? 700 : 400 }}>{label}</Typography>
      <Typography sx={{ fontSize: strong ? '1.05rem' : '0.85rem', fontWeight: strong ? 800 : 600, color: color || '#1A1A1A' }}>{value}</Typography>
    </Box>
  );
}
