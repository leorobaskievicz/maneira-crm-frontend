'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const methodLabels: Record<string, string> = {
  cash: 'Dinheiro', pix: 'PIX', debit: 'Débito', credit: 'Crédito', installment: 'Parcelado',
};
const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-400',
};

export default function FinanceiroPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [r, s] = await Promise.all([api.get('/financial'), api.get('/financial/summary')]);
    setRecords(r.data);
    setSummary(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <Button className="bg-rose-500 hover:bg-rose-600" onClick={() => toast.info('Em breve: lançamento!')}>
          <Plus className="w-4 h-4 mr-2" /> Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita do mês</CardTitle>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{fmt(summary?.total ?? 0)}</div>
            <p className="text-xs text-gray-500">{summary?.count ?? 0} transações</p>
          </CardContent>
        </Card>
        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket médio</CardTitle>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {fmt(summary?.count ? summary.total / summary.count : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-100">
        <CardHeader><CardTitle className="text-base">Lançamentos recentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400 text-sm text-center py-8">Carregando...</p> : (
            <div className="space-y-2">
              {records.slice(0, 20).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.patient?.name || r.description || 'Lançamento'}</p>
                    <p className="text-xs text-gray-500">{format(new Date(r.createdAt), 'dd/MM/yyyy')} · {methodLabels[r.paymentMethod]}</p>
                  </div>
                  <Badge className={statusColors[r.status]}>{r.status === 'paid' ? 'Pago' : r.status}</Badge>
                  <span className="text-sm font-bold text-gray-900">{fmt(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
