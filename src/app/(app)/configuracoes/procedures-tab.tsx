'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function ProceduresTab() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', durationMin: '60', price: '', returnIntervalDays: '' });

  const load = async () => {
    const res = await api.get('/procedures-catalog');
    setProcedures(res.data);
  };

  useEffect(() => { load(); }, []);

  const open = (proc?: any) => {
    if (proc) {
      setSelected(proc);
      setForm({ name: proc.name, description: proc.description || '', durationMin: String(proc.durationMin), price: String(proc.price), returnIntervalDays: String(proc.returnIntervalDays || '') });
    } else {
      setSelected(null);
      setForm({ name: '', description: '', durationMin: '60', price: '', returnIntervalDays: '' });
    }
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      const data = { ...form, durationMin: +form.durationMin, price: +form.price, returnIntervalDays: form.returnIntervalDays ? +form.returnIntervalDays : null };
      if (selected) await api.put(`/procedures-catalog/${selected.id}`, data);
      else await api.post('/procedures-catalog', data);
      toast.success(selected ? 'Procedimento atualizado!' : 'Procedimento criado!');
      setDialogOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover procedimento?')) return;
    try { await api.delete(`/procedures-catalog/${id}`); toast.success('Removido!'); load(); }
    catch { toast.error('Erro ao remover'); }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => open()} className="text-white" style={{ background: '#A0585A' }}>
          <Plus className="w-4 h-4 mr-2" /> Novo procedimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {procedures.map(p => (
          <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow bg-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button onClick={() => open(p)} className="text-gray-400 hover:text-gray-600 p-1">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" />{p.durationMin}min</span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: '#A0585A' }}><DollarSign className="w-3 h-3" />{fmt(p.price)}</span>
              {p.returnIntervalDays && <Badge variant="outline" className="text-xs">Retorno: {p.returnIntervalDays}d</Badge>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-sm font-bold">
              {selected ? 'Editar' : 'Novo'} Procedimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do procedimento" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Duração (min)</Label>
                <Input type="number" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Preço (R$)</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Intervalo de retorno (dias)</Label>
              <Input type="number" value={form.returnIntervalDays} onChange={e => setForm(f => ({ ...f, returnIntervalDays: e.target.value }))} placeholder="Ex: 30 para retorno mensal" />
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
