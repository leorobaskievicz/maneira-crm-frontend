'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agenda hoje</CardTitle>
            <Calendar className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.today?.count ?? 0}</div>
            <p className="text-xs text-gray-500">atendimentos</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita do mês</CardTitle>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.month?.revenue ?? 0)}
            </div>
            <p className="text-xs text-gray-500">ticket médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.month?.ticketMedio ?? 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pacientes ativos</CardTitle>
            <Users className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.totals?.activePatients ?? 0}</div>
            <p className="text-xs text-gray-500">cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Novos leads</CardTitle>
            <UserPlus className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.totals?.newLeads ?? 0}</div>
            <p className="text-xs text-gray-500">aguardando contato</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda do dia */}
        <div className="lg:col-span-2">
          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" /> Agenda de hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.today?.appointments?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum agendamento para hoje 🌸</p>
              ) : (
                <div className="space-y-3">
                  {data?.today?.appointments?.map((apt: any) => (
                    <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <div className="text-center w-12">
                        <div className="text-sm font-bold text-rose-600">
                          {format(new Date(apt.scheduledAt), 'HH:mm')}
                        </div>
                        <div className="text-xs text-gray-400">{apt.durationMin}min</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{apt.patient?.name}</div>
                        <div className="text-xs text-gray-500 truncate">{apt.procedure?.name}</div>
                      </div>
                      <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.alerts?.lowStock?.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum alerta ✨</p>
            ) : (
              <div className="space-y-2">
                {data?.alerts?.lowStock?.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">{p.name}</span>
                      <span className="text-gray-500 ml-1">({p.quantity} {p.unit})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
