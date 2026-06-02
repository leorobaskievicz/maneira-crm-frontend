'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Phone, Mail, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { PatientDialog } from './patient-dialog';
import { PatientSheet } from './patient-sheet';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async (q = '') => {
    const res = await api.get('/patients', { params: q ? { search: q } : {} });
    setPatients(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const handleSave = async (data: any) => {
    try {
      if (selected) await api.put(`/patients/${selected.id}`, data);
      else await api.post('/patients', data);
      toast.success(selected ? 'Paciente atualizado!' : 'Paciente cadastrado!');
      setDialogOpen(false); setSheetOpen(false); setSelected(null); load(search);
    } catch { toast.error('Erro ao salvar paciente'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients.length} pacientes cadastrados</p>
        </div>
        <Button className="bg-rose-500 hover:bg-rose-600" onClick={() => { setSelected(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova paciente
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar por nome ou telefone..." className="pl-9" value={search} onChange={handleSearch} />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((p) => (
            <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelected(p); setSheetOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <Badge variant="outline" className="text-xs border-rose-200 text-rose-600">
                    {p.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mt-2">{p.name}</h3>
                {p.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{p.phone}</p>}
                {p.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</p>}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.map((t: string) => <Badge key={t} className="text-xs bg-rose-50 text-rose-600 border-rose-100">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PatientDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelected(null); }} onSave={handleSave} patient={selected} />
      <PatientSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setSelected(null); }} onSave={handleSave} patient={selected} />
    </div>
  );
}
