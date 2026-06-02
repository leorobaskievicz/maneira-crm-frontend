'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const methodLabels: Record<string, string> = { cash: 'Dinheiro', pix: 'PIX', debit: 'Débito', credit: 'Crédito', installment: 'Parcelado' };
const statusColors: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-400' };
const statusLabels: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', cancelled: 'Cancelado' };

const emptyForm = { description: '', amount: '', paymentMethod: 'pix', status: 'paid' };

export default function FinanceiroPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'products', date: format(new Date(), 'yyyy-MM-dd') });

  const load = async () => {
    const [r, s, e] = await Promise.all([api.get('/financial'), api.get('/financial/summary'), api.get('/expenses')]);
    setRecords(r.data); setSummary(s.data); setExpenses(e.data);
  };
  useEffect(() => { load(); }, []);

  const saveRecord = async () => {
    try {
      await api.post('/financial', { ...form, amount: +form.amount });
      toast.success('Lançamento salvo!'); setDialogOpen(false); setForm(emptyForm); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const saveExpense = async () => {
    try {
      await api.post('/expenses', { ...expForm, amount: +expForm.amount });
      toast.success('Despesa salva!'); setExpenseDialogOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const lucro = (summary?.total || 0) - totalExpenses;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpenseDialogOpen(true)}>
            <TrendingDown className="w-4 h-4 mr-1" /> Despesa
          </Button>
          <Button className="text-white text-sm" style={{ background: '#A0585A' }} onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Receita
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Receita do mês</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-gray-900">{fmt(summary?.total)}</div>
            <p className="text-xs text-gray-400">{summary?.count || 0} transações</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Despesas</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 md:col-span-1">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Lucro</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(lucro)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase tracking-wider">Receitas recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {records.slice(0, 15).map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.patient?.name || r.description || 'Lançamento'}</p>
                    <p className="text-xs text-gray-400">{format(new Date(r.createdAt), 'dd/MM', { locale: ptBR })} · {methodLabels[r.paymentMethod]}</p>
                  </div>
                  <Badge className={`text-xs border-0 ${statusColors[r.status]}`}>{statusLabels[r.status]}</Badge>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(r.amount)}</span>
                </div>
              ))}
              {records.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhuma receita</p>}
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase tracking-wider">Despesas recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expenses.slice(0, 15).map(e => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                    <p className="text-xs text-gray-400">{format(new Date(e.date), 'dd/MM', { locale: ptBR })} · {e.category}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600 flex-shrink-0">{fmt(e.amount)}</span>
                </div>
              ))}
              {expenses.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhuma despesa</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Receita */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="uppercase tracking-wide text-sm font-bold">Nova Receita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Botox - Maria" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Valor (R$) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(methodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveRecord} className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Despesa */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="uppercase tracking-wide text-sm font-bold">Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Descrição *</Label><Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Valor (R$) *</Label><Input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={expForm.category} onValueChange={v => setExpForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[['products','Produtos'],['rent','Aluguel'],['equipment','Equipamentos'],['marketing','Marketing'],['taxes','Impostos'],['other','Outros']].map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Data</Label><Input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveExpense} className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
