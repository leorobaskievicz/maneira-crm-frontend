'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Package, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movType, setMovType] = useState<'in'|'out'>('in');
  const [selected, setSelected] = useState<any>(null);
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');

  const load = async () => {
    const res = await api.get('/products');
    setProducts(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isLow = (p: any) => Number(p.quantity) <= Number(p.minQuantity);

  const openMov = (p: any, type: 'in'|'out') => {
    setSelected(p); setMovType(type); setQty('1'); setReason('');
    setDialogOpen(true);
  };

  const saveMov = async () => {
    try {
      await api.post('/stock-movements', {
        product: { id: selected.id },
        type: movType,
        quantity: +qty,
        reason,
      });
      toast.success(movType === 'in' ? 'Entrada registrada!' : 'Saída registrada!');
      setDialogOpen(false);
      load();
    } catch { toast.error('Erro ao registrar movimentação'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Estoque</h1>
          <p className="text-gray-500 text-sm">{products.filter(isLow).length} produto(s) com estoque baixo</p>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Nenhum produto cadastrado.<br/>Cadastre em Configurações → Produtos.</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <Card key={p.id} className={`border-0 shadow-sm ${isLow(p) ? 'bg-amber-50/40' : 'bg-white'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#A0585A' }} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                    </div>
                  </div>
                  {isLow(p) && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{Number(p.quantity).toFixed(1)}</span>
                    <span className="text-sm text-gray-400 ml-1">{p.unit}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${isLow(p) ? 'border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500'}`}>
                    mín: {p.minQuantity}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => openMov(p, 'in')}>
                    <Plus className="w-3 h-3 mr-1" /> Entrada
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs border-red-200 text-red-500 hover:bg-red-50"
                    onClick={() => openMov(p, 'out')}>
                    <Minus className="w-3 h-3 mr-1" /> Saída
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-sm font-bold">
              {movType === 'in' ? '📦 Entrada de Estoque' : '📤 Saída de Estoque'}
            </DialogTitle>
            <p className="text-xs text-gray-500">{selected?.name}</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Quantidade ({selected?.unit})</Label>
              <Input type="number" value={qty} onChange={e => setQty(e.target.value)} min="0.001" step="0.001" />
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder={movType === 'in' ? 'Ex: Compra de fornecedor' : 'Ex: Usado no procedimento'} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveMov} className="text-white"
                style={{ background: movType === 'in' ? '#16a34a' : '#dc2626' }}>
                Confirmar {movType === 'in' ? 'Entrada' : 'Saída'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
