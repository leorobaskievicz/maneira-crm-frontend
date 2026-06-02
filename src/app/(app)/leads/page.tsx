'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700', converted: 'bg-green-100 text-green-700', lost: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = { new: 'Novo', contacted: 'Contatado', scheduled: 'Agendado', converted: 'Convertido', lost: 'Perdido' };
const sourceLabels: Record<string, string> = { google: 'Google', instagram: 'Instagram', referral: 'Indicação', whatsapp: 'WhatsApp', walk_in: 'Presencial', other: 'Outro' };
const columns = ['new', 'contacted', 'scheduled', 'converted', 'lost'];

const emptyForm = { name: '', phone: '', email: '', procedureInterest: '', source: 'other', notes: '' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => { const res = await api.get('/leads'); setLeads(res.data); };
  useEffect(() => { load(); }, []);

  const open = (lead?: any) => {
    if (lead) { setSelected(lead); setForm({ name: lead.name, phone: lead.phone || '', email: lead.email || '', procedureInterest: lead.procedureInterest || '', source: lead.source, notes: lead.notes || '' }); }
    else { setSelected(null); setForm(emptyForm); }
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      if (selected) await api.put(`/leads/${selected.id}`, form);
      else await api.post('/leads', form);
      toast.success(selected ? 'Lead atualizado!' : 'Lead criado!');
      setDialogOpen(false); load();
    } catch { toast.error('Erro ao salvar lead'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.put(`/leads/${id}`, { status }); load(); }
    catch { toast.error('Erro ao atualizar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover lead?')) return;
    try { await api.delete(`/leads/${id}`); toast.success('Removido!'); load(); }
    catch { toast.error('Erro ao remover'); }
  };

  const byStatus = (s: string) => leads.filter(l => l.status === s);

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Leads</h1>
          <p className="text-gray-500 text-sm">{leads.length} leads cadastrados</p>
        </div>
        <Button className="text-white" style={{ background: '#A0585A' }} onClick={() => open()}>
          <Plus className="w-4 h-4 mr-2" /> Novo lead
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(status => (
          <div key={status} className="flex-shrink-0 w-60">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${statusColors[status]} border-0`}>{statusLabels[status]}</Badge>
              <span className="text-xs text-gray-400 font-medium">{byStatus(status).length}</span>
            </div>
            <div className="space-y-2">
              {byStatus(status).map(lead => (
                <Card key={lead.id} className="border border-gray-100 shadow-none hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 text-sm flex-1">{lead.name}</p>
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => open(lead)} className="text-gray-300 hover:text-gray-500 text-xs p-0.5">✏️</button>
                        <button onClick={() => remove(lead.id)} className="text-gray-300 hover:text-red-400 text-xs p-0.5">✕</button>
                      </div>
                    </div>
                    {lead.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                    {lead.procedureInterest && <p className="text-xs mt-1" style={{ color: '#A0585A' }}>{lead.procedureInterest}</p>}
                    <p className="text-xs text-gray-400 mt-1">{sourceLabels[lead.source]}</p>
                    {/* Avançar status */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {columns.filter(s => s !== status).map(s => (
                        <button key={s} onClick={() => updateStatus(lead.id, s)}
                          className="text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-400 hover:border-[#A0585A] hover:text-[#A0585A] transition-colors">
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {byStatus(status).length === 0 && (
                <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-xs text-gray-300">
                  Nenhum lead
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-sm font-bold">{selected ? 'Editar' : 'Novo'} Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(41) 9..." /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-span-2 space-y-1">
                <Label>Interesse</Label>
                <Select value={form.procedureInterest} onValueChange={v => setForm(f => ({ ...f, procedureInterest: v }))}>
                  <SelectTrigger><SelectValue placeholder="Procedimento de interesse" /></SelectTrigger>
                  <SelectContent>
                    {['Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster','Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação','Radiofrequência','PEIM','HIFU Corporal','Depilação a Laser','Outro'].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Origem</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
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
