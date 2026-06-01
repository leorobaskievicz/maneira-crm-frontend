'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, Tag } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700', converted: 'bg-green-100 text-green-700', lost: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = {
  new: 'Novo', contacted: 'Contatado', scheduled: 'Agendado', converted: 'Convertido', lost: 'Perdido',
};
const sourceLabels: Record<string, string> = {
  google: 'Google', instagram: 'Instagram', referral: 'Indicação', whatsapp: 'WhatsApp', walk_in: 'Presencial', other: 'Outro',
};

const columns = ['new', 'contacted', 'scheduled', 'converted', 'lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await api.get('/leads');
    setLeads(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/leads/${id}`, { status });
      toast.success('Status atualizado!');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const byStatus = (status: string) => leads.filter(l => l.status === status);

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm">{leads.length} leads cadastrados</p>
        </div>
        <Button className="bg-rose-500 hover:bg-rose-600" onClick={() => toast.info('Em breve: formulário de lead!')}>
          <Plus className="w-4 h-4 mr-2" /> Novo lead
        </Button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(status => (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
                <span className="text-xs text-gray-500">{byStatus(status).length}</span>
              </div>
              <div className="space-y-2">
                {byStatus(status).map(lead => (
                  <Card key={lead.id} className="border-rose-100 hover:shadow-sm transition-shadow">
                    <CardContent className="p-3">
                      <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                      {lead.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                      {lead.procedureInterest && <p className="text-xs text-rose-600 mt-1">{lead.procedureInterest}</p>}
                      <p className="text-xs text-gray-400 mt-1">{sourceLabels[lead.source]}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {columns.filter(s => s !== status).slice(0,2).map(s => (
                          <button key={s} onClick={() => updateStatus(lead.id, s)}
                            className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors">
                            → {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
