'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Tab, Tabs, List, ListItem, ListItemText,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, endOfMonth, eachWeekOfInterval, startOfMonth, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';

const PAYMENT_LABELS: Record<string, string> = { cash: 'Dinheiro', pix: 'PIX', debit: 'Débito', credit: 'Crédito', installment: 'Parcelado' };
const STATUS_LABELS: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', cancelled: 'Cancelado' };
const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = { paid: 'success', pending: 'warning', overdue: 'error', cancelled: 'default' };
const EXP_CATS = [['products','Produtos'],['rent','Aluguel'],['equipment','Equipamentos'],['marketing','Marketing'],['taxes','Impostos'],['other','Outros']];

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinanceiroPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [recDialog, setRecDialog] = useState(false);
  const [expDialog, setExpDialog] = useState(false);
  const [recForm, setRecForm] = useState({ description: '', amount: '', paymentMethod: 'pix', status: 'paid' });
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'products', date: format(new Date(), 'yyyy-MM-dd') });

  const load = async () => {
    const [r, s, e] = await Promise.all([api.get('/financial'), api.get('/financial/summary'), api.get('/expenses')]);
    setRecords(r.data); setSummary(s.data); setExpenses(e.data);
  };
  useEffect(() => { load(); }, []);

  const saveRecord = async () => {
    try { await api.post('/financial', { ...recForm, amount: +recForm.amount }); toast.success('Lançamento salvo!'); setRecDialog(false); load(); }
    catch { toast.error('Erro ao salvar'); }
  };
  const saveExpense = async () => {
    try { await api.post('/expenses', { ...expForm, amount: +expForm.amount }); toast.success('Despesa salva!'); setExpDialog(false); load(); }
    catch { toast.error('Erro ao salvar'); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const lucro = (summary?.total || 0) - totalExpenses;

  const byMethod = Object.entries(PAYMENT_LABELS).map(([k, v]) => ({
    name: v, total: records.filter(r => r.paymentMethod === k && r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0),
  })).filter(m => m.total > 0);

  const now = new Date();
  const weeks = eachWeekOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }, { weekStartsOn: 1 });
  const weeklyData = weeks.map((ws, i) => {
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    return {
      name: `Sem ${i + 1}`,
      Receita: records.filter(r => { const d = new Date(r.createdAt); return d >= ws && d <= we && r.status === 'paid'; }).reduce((s, r) => s + Number(r.amount), 0),
      Despesa: expenses.filter(e => { const d = new Date(e.date); return d >= ws && d <= we; }).reduce((s, e) => s + Number(e.amount), 0),
    };
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Financeiro</Typography>
          <Typography variant="body2">{format(now, 'MMMM yyyy', { locale: ptBR })}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<TrendingDownOutlinedIcon />} onClick={() => setExpDialog(true)} sx={{ borderColor: '#EDE8E8', color: '#6B6B6B' }}>
            Despesa
          </Button>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => setRecDialog(true)}>
            Receita
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'RECEITA DO MÊS', value: fmt(summary?.total), sub: `${summary?.count || 0} transações` },
          { label: 'TICKET MÉDIO', value: fmt(summary?.count ? summary.total / summary.count : 0), sub: 'por atendimento' },
          { label: 'DESPESAS', value: fmt(totalExpenses), sub: 'no período', valueColor: '#D32F2F' },
          { label: 'LUCRO', value: fmt(lucro), sub: 'receita − despesas', valueColor: lucro >= 0 ? '#388E3C' : '#D32F2F' },
        ].map(kpi => (
          <Grid key={kpi.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#9E9E9E', mb: 1.5 }}>{kpi.label}</Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: kpi.valueColor || '#1A1A1A', lineHeight: 1.2 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#BDBDBD' }}>{kpi.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #EDE8E8', mb: 3 }}>
        <Tab label="Lançamentos" />
        <Tab label="Relatório" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Receitas recentes</Typography>
                <Divider sx={{ mb: 1 }} />
                <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {records.slice(0, 15).map((r, i) => (
                    <ListItem key={r.id} divider={i < Math.min(records.length, 15) - 1} sx={{ px: 0, py: 1.25 }}>
                      <ListItemText
                        primary={r.patient?.name || r.description || 'Lançamento'}
                        secondary={`${format(new Date(r.createdAt), 'dd/MM', { locale: ptBR })} · ${PAYMENT_LABELS[r.paymentMethod]}`}
                        slotProps={{ primary: { style: { fontSize: '0.875rem', fontWeight: 500 } }, secondary: { style: { fontSize: '0.8rem' } } }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{fmt(r.amount)}</Typography>
                        <Chip label={STATUS_LABELS[r.status]} size="small" color={STATUS_COLORS[r.status]} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </ListItem>
                  ))}
                  {records.length === 0 && <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Nenhuma receita</Typography></Box>}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Despesas recentes</Typography>
                <Divider sx={{ mb: 1 }} />
                <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {expenses.slice(0, 15).map((e, i) => (
                    <ListItem key={e.id} divider={i < Math.min(expenses.length, 15) - 1} sx={{ px: 0, py: 1.25 }}>
                      <ListItemText
                        primary={e.description}
                        secondary={`${format(new Date(e.date), 'dd/MM', { locale: ptBR })} · ${e.category}`}
                        slotProps={{ primary: { style: { fontSize: '0.875rem', fontWeight: 500 } }, secondary: { style: { fontSize: '0.8rem' } } }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#D32F2F' }}>{fmt(e.amount)}</Typography>
                    </ListItem>
                  ))}
                  {expenses.length === 0 && <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Nenhuma despesa</Typography></Box>}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Receita vs Despesa — Semanas do mês</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECEC" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 4, border: '1px solid #EDE8E8', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Receita" fill="#A0585A" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Despesa" fill="#EDD5D5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Receita por forma de pagamento</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {byMethod.sort((a, b) => b.total - a.total).map(m => (
                    <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ width: 80, flexShrink: 0, color: '#6B6B6B' }}>{m.name}</Typography>
                      <Box sx={{ flex: 1, backgroundColor: '#F7F5F5', borderRadius: '2px', height: 8, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', backgroundColor: '#A0585A', borderRadius: '2px', width: `${(m.total / (summary?.total || 1)) * 100}%`, transition: 'width 0.5s ease' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', width: 100, textAlign: 'right', flexShrink: 0 }}>{fmt(m.total)}</Typography>
                    </Box>
                  ))}
                  {byMethod.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Nenhuma receita no período</Typography>}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialog Receita */}
      <Dialog open={recDialog} onClose={() => setRecDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Receita</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField label="Descrição" fullWidth value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Valor (R$) *" type="number" fullWidth value={recForm.amount} onChange={e => setRecForm(f => ({ ...f, amount: e.target.value }))} /></Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small"><InputLabel>Forma de pagamento</InputLabel>
                <Select value={recForm.paymentMethod} label="Forma de pagamento" onChange={e => setRecForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
                <Select value={recForm.status} label="Status" onChange={e => setRecForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveRecord} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Despesa */}
      <Dialog open={expDialog} onClose={() => setExpDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Despesa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField label="Descrição *" fullWidth value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Valor (R$) *" type="number" fullWidth value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} /></Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small"><InputLabel>Categoria</InputLabel>
                <Select value={expForm.category} label="Categoria" onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
                  {EXP_CATS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}><TextField label="Data" type="date" fullWidth value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveExpense} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
