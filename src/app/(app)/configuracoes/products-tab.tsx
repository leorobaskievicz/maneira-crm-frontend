'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', brand: '', unit: 'un', quantity: '0', minQuantity: '0', costPrice: '' });

  const load = async () => { const res = await api.get('/products'); setProducts(res.data); };
  useEffect(() => { load(); }, []);

  const open = (prod?: any) => {
    if (prod) {
      setSelected(prod);
      setForm({ name: prod.name, brand: prod.brand || '', unit: prod.unit, quantity: String(prod.quantity), minQuantity: String(prod.minQuantity), costPrice: String(prod.costPrice || '') });
    } else {
      setSelected(null);
      setForm({ name: '', brand: '', unit: 'un', quantity: '0', minQuantity: '0', costPrice: '' });
    }
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      const data = { ...form, quantity: +form.quantity, minQuantity: +form.minQuantity, costPrice: form.costPrice ? +form.costPrice : null };
      if (selected) await api.put(`/products/${selected.id}`, data);
      else await api.post('/products', data);
      toast.success(selected ? 'Produto atualizado!' : 'Produto criado!');
      setDialogOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover produto?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Removido!'); load(); }
    catch { toast.error('Erro ao remover'); }
  };

  const isLow = (p: any) => Number(p.quantity) <= Number(p.minQuantity);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => open()} className="text-white" style={{ background: '#A0585A' }}>
          <Plus className="w-4 h-4 mr-2" /> Novo produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className={`border rounded-xl p-4 hover:shadow-sm transition-shadow bg-white ${isLow(p) ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
              </div>
              <div className="flex gap-1 items-center">
                {isLow(p) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <button onClick={() => open(p)} className="text-gray-400 hover:text-gray-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-gray-900">{p.quantity}</span>
              <span className="text-sm text-gray-500">{p.unit}</span>
              <Badge variant="outline" className="ml-auto text-xs">mín: {p.minQuantity}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-sm font-bold">{selected ? 'Editar' : 'Novo'} Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="un, ml, g..." />
              </div>
              <div className="space-y-1">
                <Label>Estoque atual</Label>
                <Input type="number" step="0.001" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Estoque mínimo</Label>
                <Input type="number" step="0.001" value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Custo unitário (R$)</Label>
                <Input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="text-white" style={{ background: '#A0585A' }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
