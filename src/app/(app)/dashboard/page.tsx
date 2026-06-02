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

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

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
    </Box>
  );
}
