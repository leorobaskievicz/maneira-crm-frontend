'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, IconButton, Chip, Divider, Switch, FormControlLabel, Avatar,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';
import { NAV_SECTIONS, getStoredUser } from '@/components/layout/nav';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ── Procedimentos ──────────────────────────────────────────────
function ProceduresTab() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', durationMin: '60', price: '', returnIntervalDays: '' });

  const load = async () => { const r = await api.get('/procedures-catalog'); setList(r.data); };
  useEffect(() => { load(); }, []);

  const openDlg = (p?: any) => {
    setSel(p || null);
    setForm(p ? { name: p.name, description: p.description || '', durationMin: String(p.durationMin), price: String(p.price), returnIntervalDays: String(p.returnIntervalDays || '') } : { name: '', description: '', durationMin: '60', price: '', returnIntervalDays: '' });
    setOpen(true);
  };

  const save = async () => {
    try {
      const data = { ...form, durationMin: +form.durationMin, price: +form.price, returnIntervalDays: form.returnIntervalDays ? +form.returnIntervalDays : null };
      if (sel) await api.put(`/procedures-catalog/${sel.id}`, data); else await api.post('/procedures-catalog', data);
      toast.success(sel ? 'Atualizado!' : 'Criado!'); setOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover?')) return;
    await api.delete(`/procedures-catalog/${id}`); toast.success('Removido!'); load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => openDlg()}>
          Novo procedimento
        </Button>
      </Box>
      <Grid container spacing={2}>
        {list.map(p => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ '&:hover': { borderColor: '#A0585A55' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, pr: 1 }}>{p.name}</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => openDlg(p)}><EditOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                    <IconButton size="small" onClick={() => remove(p.id)}><DeleteOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                  </Box>
                </Box>
                {p.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</Typography>}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<AccessTimeOutlinedIcon sx={{ fontSize: '13px !important' }} />} label={`${p.durationMin}min`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 22, borderColor: '#EDE8E8' }} />
                  <Chip icon={<AttachMoneyOutlinedIcon sx={{ fontSize: '13px !important' }} />} label={fmt(p.price)} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 22, borderColor: '#A0585A55', color: '#A0585A' }} />
                  {p.returnIntervalDays && <Chip label={`Retorno: ${p.returnIntervalDays}d`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 22, borderColor: '#EDE8E8' }} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{sel ? 'Editar' : 'Novo'} Procedimento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField label="Nome *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid>
            <Grid size={12}><TextField label="Descrição" fullWidth multiline rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Duração (min)" type="number" fullWidth value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Preço (R$)" type="number" fullWidth value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Retorno (dias)" type="number" fullWidth value={form.returnIntervalDays} onChange={e => setForm(f => ({ ...f, returnIntervalDays: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Produtos ───────────────────────────────────────────────────
function ProductsTab() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState({ name: '', brand: '', unit: 'un', quantity: '0', minQuantity: '0', costPrice: '' });

  const load = async () => { const r = await api.get('/products'); setList(r.data); };
  useEffect(() => { load(); }, []);

  const openDlg = (p?: any) => {
    setSel(p || null);
    setForm(p ? { name: p.name, brand: p.brand || '', unit: p.unit, quantity: String(p.quantity), minQuantity: String(p.minQuantity), costPrice: String(p.costPrice || '') } : { name: '', brand: '', unit: 'un', quantity: '0', minQuantity: '0', costPrice: '' });
    setOpen(true);
  };

  const save = async () => {
    try {
      const data = { ...form, quantity: +form.quantity, minQuantity: +form.minQuantity, costPrice: form.costPrice ? +form.costPrice : null };
      if (sel) await api.put(`/products/${sel.id}`, data); else await api.post('/products', data);
      toast.success(sel ? 'Atualizado!' : 'Criado!'); setOpen(false); load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover?')) return;
    await api.delete(`/products/${id}`); toast.success('Removido!'); load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => openDlg()}>
          Novo produto
        </Button>
      </Box>
      <Grid container spacing={2}>
        {list.map(p => {
          const isLow = Number(p.quantity) <= Number(p.minQuantity);
          return (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ borderColor: isLow ? '#F57C00' : undefined }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</Typography>
                      {p.brand && <Typography variant="caption" color="text.secondary">{p.brand}</Typography>}
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openDlg(p)}><EditOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                      <IconButton size="small" onClick={() => remove(p.id)}><DeleteOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: isLow ? '#F57C00' : '#1A1A1A' }}>
                      {Number(p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{p.unit}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>mín: {p.minQuantity}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{sel ? 'Editar' : 'Novo'} Produto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 8 }}><TextField label="Nome *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField label="Unidade" fullWidth value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="un, ml, g..." /></Grid>
            <Grid size={12}><TextField label="Marca" fullWidth value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Estoque atual" type="number" fullWidth value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Estoque mínimo" type="number" fullWidth value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value }))} /></Grid>
            <Grid size={4}><TextField label="Custo (R$)" type="number" fullWidth value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Clínica ────────────────────────────────────────────────────
function ClinicTab() {
  const DEFAULT = { name: 'Clínica Caroline Maneira', phone: '(41) 98444-3694', address: 'Rua Amaro de Santa Rita, 357, Sala 2 - Curitiba/PR', hours: 'Segunda a Sábado, 9h às 18h', email: 'contato@carolinemaneira.com.br', instagram: '@carolinemaneira' };
  const [form, setForm] = useState(DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem('clinic_config');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const save = () => { localStorage.setItem('clinic_config', JSON.stringify(form)); toast.success('Configurações salvas!'); };

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informações da clínica exibidas nas landing pages e relatórios.
      </Typography>
      <Grid container spacing={2}>
        {[
          { key: 'name', label: 'Nome da clínica' },
          { key: 'phone', label: 'Telefone / WhatsApp' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Endereço completo' },
          { key: 'hours', label: 'Horário de funcionamento' },
          { key: 'instagram', label: 'Instagram' },
        ].map(({ key, label }) => (
          <Grid key={key} size={12}>
            <TextField label={label} fullWidth value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </Grid>
        ))}
        <Grid size={12}>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>Salvar configurações</Button>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Usuários ───────────────────────────────────────────────────
const emptyUser = () => ({ id: '', name: '', email: '', password: '', role: 'professional', active: true, permissions: [] as string[] });

function UsersTab() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyUser());
  const meId = getStoredUser()?.id;

  const load = async () => { try { const r = await api.get('/users'); setList(r.data); } catch { toast.error('Erro ao carregar usuários'); } };
  useEffect(() => { load(); }, []);

  const openDlg = (u?: any) => {
    setForm(u
      ? { id: u.id, name: u.name, email: u.email, password: '', role: u.role, active: u.active, permissions: u.permissions || [] }
      : emptyUser());
    setOpen(true);
  };

  const togglePerm = (href: string) => setForm(f => ({
    ...f,
    permissions: f.permissions.includes(href) ? f.permissions.filter(p => p !== href) : [...f.permissions, href],
  }));
  const toggleSection = (hrefs: string[], on: boolean) => setForm(f => ({
    ...f,
    permissions: on ? Array.from(new Set([...f.permissions, ...hrefs])) : f.permissions.filter(p => !hrefs.includes(p)),
  }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Nome e email são obrigatórios');
    if (!form.id && form.password.length < 6) return toast.error('Senha de no mínimo 6 caracteres');
    try {
      const payload: any = {
        name: form.name, email: form.email, role: form.role, active: form.active,
        permissions: form.role === 'admin' ? [] : form.permissions,
      };
      if (form.password) payload.password = form.password;
      if (form.id) await api.put(`/users/${form.id}`, payload);
      else await api.post('/users', payload);
      toast.success(form.id ? 'Usuário atualizado!' : 'Usuário criado!');
      setOpen(false); load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const remove = async (u: any) => {
    if (u.id === meId) return toast.error('Você não pode excluir o próprio usuário');
    if (!confirm(`Excluir o usuário ${u.name}?`)) return;
    try { await api.delete(`/users/${u.id}`); toast.success('Usuário removido'); load(); }
    catch { toast.error('Erro ao remover'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => openDlg()}>
          Novo usuário
        </Button>
      </Box>

      <Grid container spacing={2}>
        {list.map(u => (
          <Grid key={u.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ '&:hover': { borderColor: '#A0585A55' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, backgroundColor: u.role === 'admin' ? '#1A1A1A' : '#A0585A', fontSize: '0.9rem', fontWeight: 700 }}>
                    {u.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#9A9A9A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openDlg(u)}><EditOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                    <IconButton size="small" onClick={() => remove(u)}><DeleteOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} /></IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                  {u.role === 'admin'
                    ? <Chip icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: '14px !important' }} />} label="Administrador" size="small" sx={{ height: 22, fontSize: '0.7rem', backgroundColor: '#1A1A1A', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
                    : <Chip label={`${u.permissions?.length || 0} rotina(s)`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', borderColor: '#EDE8E8' }} />}
                  {!u.active && <Chip label="Inativo" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', borderColor: '#D32F2F', color: '#D32F2F' }} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nome *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField type="email" label="Email *" fullWidth value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField type="password" label={form.id ? 'Nova senha (deixe em branco p/ manter)' : 'Senha *'} fullWidth value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.role} label="Tipo" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <MenuItem value="admin">Administrador (acesso total)</MenuItem>
                  <MenuItem value="professional">Limitado (por rotina)</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel control={<Switch checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />} label="Ativo" />
            </Box>

            {form.role === 'admin' ? (
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#F7F5F5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettingsOutlinedIcon fontSize="small" sx={{ color: '#1A1A1A' }} />
                <Typography variant="body2" color="text.secondary">Administradores têm acesso a todas as rotinas automaticamente.</Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Rotinas liberadas</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {NAV_SECTIONS.map(section => {
                    const hrefs = section.items.map(i => i.href);
                    const allOn = hrefs.every(h => form.permissions.includes(h));
                    return (
                      <Box key={section.heading} sx={{ border: '1px solid #EDE8E8', borderRadius: '8px', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{section.heading}</Typography>
                          <Button size="small" onClick={() => toggleSection(hrefs, !allOn)} sx={{ fontSize: '0.7rem', color: '#A0585A', minWidth: 0 }}>
                            {allOn ? 'Limpar' : 'Marcar todos'}
                          </Button>
                        </Box>
                        {section.items.map(item => (
                          <FormControlLabel key={item.href}
                            control={<Switch size="small" checked={form.permissions.includes(item.href)} onChange={() => togglePerm(item.href)} />}
                            label={<Typography variant="body2">{item.label}</Typography>}
                            sx={{ display: 'flex', ml: 0 }}
                          />
                        ))}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>{form.id ? 'Salvar' : 'Criar usuário'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { setIsAdmin(getStoredUser()?.role === 'admin'); }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Configurações</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid #EDE8E8', mb: 3 }}>
        <Tab label="Procedimentos" />
        <Tab label="Produtos" />
        <Tab label="Clínica" />
        {isAdmin && <Tab label="Usuários" />}
      </Tabs>
      {tab === 0 && <ProceduresTab />}
      {tab === 1 && <ProductsTab />}
      {tab === 2 && <ClinicTab />}
      {tab === 3 && isAdmin && <UsersTab />}
    </Box>
  );
}
