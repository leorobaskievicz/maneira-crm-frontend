'use client';
import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction, CircularProgress, Alert,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  scheduled: { label: 'Agendado', color: 'info' },
  confirmed: { label: 'Confirmado', color: 'success' },
  in_progress: { label: 'Em andamento', color: 'warning' },
  completed: { label: 'Concluído', color: 'default' },
  no_show: { label: 'Faltou', color: 'error' },
  cancelled: { label: 'Cancelado', color: 'default' },
};

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" sx={{ color: '#9E9E9E', fontSize: '0.7rem' }}>{label}</Typography>
          <Box sx={{ color: '#A0585A', opacity: 0.7 }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2 }}>
          {value}
        </Typography>
        {sub && <Typography variant="caption" sx={{ color: '#BDBDBD', mt: 0.5, display: 'block' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  google: '#4285F4', instagram: '#E1306C', whatsapp: '#25D366',
  referral: '#7B1FA2', walk_in: '#00897B', roleta: '#8E24AA', other: '#9E9E9E',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [commercial, setCommercial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard').then(r => setData(r.data)),
      api.get('/dashboard/commercial').then(r => setCommercial(r.data)).catch(() => {}),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtShort = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <CircularProgress size={32} sx={{ color: '#A0585A' }} />
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A1A1A' }}>Dashboard</Typography>
        <Typography variant="body2" sx={{ color: '#9E9E9E', mt: 0.5 }}>
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KPICard
            icon={<CalendarTodayOutlinedIcon fontSize="small" />}
            label="AGENDA HOJE"
            value={String(data?.today?.count ?? 0)}
            sub="atendimentos"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KPICard
            icon={<AttachMoneyOutlinedIcon fontSize="small" />}
            label="RECEITA DO MÊS"
            value={fmt(data?.month?.revenue)}
            sub={`ticket médio ${fmt(data?.month?.ticketMedio)}`}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KPICard
            icon={<PeopleOutlinedIcon fontSize="small" />}
            label="PACIENTES ATIVAS"
            value={String(data?.totals?.activePatients ?? 0)}
            sub="cadastradas"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KPICard
            icon={<PersonAddOutlinedIcon fontSize="small" />}
            label="NOVOS LEADS"
            value={String(data?.totals?.newLeads ?? 0)}
            sub="aguardando contato"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Agenda do dia */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTimeOutlinedIcon fontSize="small" sx={{ color: '#A0585A' }} />
                <Typography variant="h6">Agenda de hoje</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {!data?.today?.appointments?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#BDBDBD' }}>Nenhum agendamento para hoje 🌸</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {data.today.appointments.map((apt: any, i: number) => (
                    <ListItem
                      key={apt.id}
                      divider={i < data.today.appointments.length - 1}
                      sx={{ px: 0, py: 1.5 }}
                    >
                      <Box sx={{ mr: 2, textAlign: 'center', minWidth: 44 }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#A0585A' }}>
                          {format(parseISO(apt.scheduledAt), 'HH:mm')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#BDBDBD' }}>
                          {apt.durationMin}min
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={apt.patient?.name}
                        secondary={apt.procedure?.name}
                        slotProps={{
                          primary: { style: { fontWeight: 600, fontSize: '0.875rem' } },
                          secondary: { style: { fontSize: '0.8rem' } },
                        }}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={statusMap[apt.status]?.label}
                          color={statusMap[apt.status]?.color}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningAmberOutlinedIcon fontSize="small" sx={{ color: '#F57C00' }} />
                <Typography variant="h6">Alertas</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {!data?.alerts?.lowStock?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#BDBDBD' }}>Tudo em ordem ✨</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {data.alerts.lowStock.map((p: any) => (
                    <ListItem key={p.id} sx={{ px: 0, py: 1 }}>
                      <Alert severity="warning" sx={{ width: '100%', py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                        <Typography variant="caption">Estoque: {p.quantity} {p.unit} (mín: {p.minQuantity})</Typography>
                      </Alert>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== Comercial ===== */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 2 }}>
        <TrendingUpOutlinedIcon fontSize="small" sx={{ color: '#A0585A' }} />
        <Typography variant="h6" sx={{ fontSize: '0.8rem', letterSpacing: '0.06em' }}>COMERCIAL — FUNIL DE VENDAS</Typography>
      </Box>

      {/* KPIs comerciais */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <KPICard icon={<AttachMoneyOutlinedIcon fontSize="small" />} label="EM NEGOCIAÇÃO" value={fmtShort(commercial?.totals?.value)} sub="valor potencial no funil" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KPICard icon={<FilterAltOutlinedIcon fontSize="small" />} label="LEADS NO FUNIL" value={String(commercial?.totals?.leads ?? 0)} sub="oportunidades ativas" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KPICard icon={<WarningAmberOutlinedIcon fontSize="small" />} label="LEADS PARADOS" value={String(commercial?.stalled?.count ?? 0)} sub={`sem contato há +${commercial?.stalled?.days ?? 7} dias`} />
        </Grid>
      </Grid>

      {!commercial?.totals?.leads ? (
        <Card>
          <CardContent>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B6B6B' }}>Nenhum lead no funil ainda</Typography>
              <Typography variant="caption" sx={{ color: '#BDBDBD' }}>Cadastre leads em Comercial → Leads para ver o pipeline e as origens aqui.</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {/* Funil por etapa */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Pipeline por etapa</Typography>
                <Divider sx={{ mb: 2 }} />
                {(() => {
                  const maxCount = Math.max(...commercial.pipeline.map((s: any) => s.count), 1);
                  return commercial.pipeline.map((s: any) => (
                    <Box key={s.name} sx={{ mb: 1.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          {s.value > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#388E3C', fontWeight: 700 }}>{fmtShort(s.value)}</Typography>}
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A1A1A', minWidth: 20, textAlign: 'right' }}>{s.count}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ height: 8, borderRadius: 4, backgroundColor: '#F0ECEC', overflow: 'hidden' }}>
                        <Box sx={{ width: `${(s.count / maxCount) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: s.color, transition: 'width .3s' }} />
                      </Box>
                    </Box>
                  ));
                })()}
              </CardContent>
            </Card>
          </Grid>

          {/* Leads por origem */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Leads por origem</Typography>
                <Divider sx={{ mb: 2 }} />
                {!commercial.bySource?.length ? (
                  <Typography variant="body2" sx={{ color: '#BDBDBD', py: 2, textAlign: 'center' }}>Sem origem registrada</Typography>
                ) : (() => {
                  const maxSrc = Math.max(...commercial.bySource.map((s: any) => s.count), 1);
                  return commercial.bySource.map((s: any) => {
                    const color = SOURCE_COLORS[s.source] || '#9E9E9E';
                    return (
                      <Box key={s.source} sx={{ mb: 1.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.label}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            {s.value > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#388E3C', fontWeight: 700 }}>{fmtShort(s.value)}</Typography>}
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A1A1A' }}>{s.count}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ height: 8, borderRadius: 4, backgroundColor: '#F0ECEC', overflow: 'hidden' }}>
                          <Box sx={{ width: `${(s.count / maxSrc) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color, transition: 'width .3s' }} />
                        </Box>
                      </Box>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
