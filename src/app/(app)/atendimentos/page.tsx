'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Plus, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AtendimentosPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await api.get('/appointments');
    setAppointments(res.data.filter((a: any) => ['confirmed', 'in_progress', 'scheduled'].includes(a.status)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/products').then(r => setAllProducts(r.data));
  }, []);

  const openRecord = async (apt: any) => {
    setSelected(apt);
    setNotes('');
    setProducts([]);
    try {
      const res = await api.get(`/medical-records/patient/${apt.patient?.id}`);
      const existing = res.data.find((r: any) => r.appointment?.id === apt.id);
      if (existing) {
        setRecord(existing);
        setNotes(existing.notes || '');
        setProducts(existing.productsUsed || []);
      } else {
        setRecord(null);
      }
    } catch { setRecord(null); }
    setDialogOpen(true);
  };

  const addProduct = () => {
    const prod = allProducts.find(p => p.id === selectedProduct);
    if (!prod) return;
    setProducts(prev => [...prev, { productId: prod.id, productName: prod.name, quantity: +qty }]);
    setSelectedProduct(''); setQty('1');
  };

  const saveRecord = async () => {
    try {
      const data = {
        appointment: { id: selected.id },
        patient: { id: selected.patient?.id },
        notes,
        productsUsed: products,
      };
      if (record) await api.put(`/medical-records/${record.id}`, data);
      else await api.post('/medical-records', data);
      await api.put(`/appointments/${selected.id}`, { status: 'completed' });
      toast.success('Atendimento registrado!');
      setDialogOpen(false);
      load();
    } catch { toast.error('Erro ao salvar atendimento'); }
  };

  const filtered = appointments.filter(a =>
    a.patient?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Atendimentos</h1>
          <p className="text-gray-500 text-sm">Registre os procedimentos realizados</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar paciente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <p className="text-center text-gray-400 py-12">Carregando...</p> : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Nenhum atendimento pendente 🌸</p>}
          {filtered.map(apt => (
            <Card key={apt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openRecord(apt)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: '#A0585A' }}>
                  {apt.patient?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{apt.patient?.name}</p>
                  <p className="text-sm text-gray-500">{apt.procedure?.name}</p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(apt.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })} · {apt.durationMin}min
                  </p>
                </div>
                <Button size="sm" className="text-white flex-shrink-0" style={{ background: '#A0585A' }}>
                  <FileText className="w-4 h-4 mr-1" /> Registrar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-sm font-bold">
              Prontuário — {selected?.patient?.name}
            </DialogTitle>
            <p className="text-xs text-gray-500">{selected?.procedure?.name}</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Observações do atendimento</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Descreva o procedimento realizado, intercorrências, recomendações pós-procedimento..."
                rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Produtos utilizados</Label>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Produto" /></SelectTrigger>
                  <SelectContent>
                    {allProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-16" min="0.1" step="0.1" />
                <Button type="button" variant="outline" onClick={addProduct}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {products.length > 0 && (
                <div className="space-y-1">
                  {products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{p.productName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{p.quantity}</Badge>
                        <button onClick={() => setProducts(prev => prev.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveRecord} className="text-white" style={{ background: '#A0585A' }}>
                Salvar e Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
