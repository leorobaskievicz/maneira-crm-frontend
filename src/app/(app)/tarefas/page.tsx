'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Card, CardContent, IconButton, Tooltip, Chip,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function TarefasPage() {
  const [boards, setBoards] = useState<any[]>([]);
  const [boardDlg, setBoardDlg] = useState(false);
  const [boardForm, setBoardForm] = useState({ id: '', name: '', description: '' });

  const loadBoards = async () => {
    const r = await api.get('/boards');
    setBoards(r.data.filter((b: any) => b.name !== 'Leads'));
  };

  useEffect(() => { loadBoards(); }, []);

  const saveBoard = async () => {
    if (!boardForm.name) return toast.error('Nome obrigatório');
    try {
      if (boardForm.id) await api.put(`/boards/${boardForm.id}`, boardForm);
      else await api.post('/boards', boardForm);
      toast.success('Quadro salvo!'); setBoardDlg(false); loadBoards();
    } catch { toast.error('Erro ao salvar quadro'); }
  };

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir este quadro inteiro? Isso apagará todas as colunas e cartões dentro dele!')) return;
    try { await api.delete(`/boards/${id}`); toast.success('Quadro excluído'); loadBoards(); }
    catch { toast.error('Erro ao excluir quadro'); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} sx={{ backgroundColor: '#A0585A' }} onClick={() => { setBoardForm({ id: '', name: '', description: '' }); setBoardDlg(true); }}>
          Novo Quadro
        </Button>
      </Box>

      {boards.length === 0 ? (
        <Box sx={{ py: 12, textAlign: 'center', border: '1px dashed #EDE8E8', borderRadius: '6px' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#6B6B6B' }}>Nenhum quadro criado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Crie quadros Kanban para organizar tarefas e processos internos da clínica
          </Typography>
          <Button variant="contained" sx={{ backgroundColor: '#A0585A' }} onClick={() => { setBoardForm({ id: '', name: '', description: '' }); setBoardDlg(true); }}>
            Criar primeiro quadro
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {boards.map(b => (
            <Grid key={b.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Link href={`/tarefas/${b.id}`} style={{ textDecoration: 'none' }}>
                <Card sx={{ border: '1px solid #EDE8E8', '&:hover': { borderColor: '#A0585A55', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
                  <Box sx={{ height: 4, backgroundColor: '#1A1A1A' }} />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentTurnedInOutlinedIcon sx={{ color: '#A0585A', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1A1A1A' }}>{b.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', ml: 1 }}>
                        <Tooltip title="Editar Nome">
                          <IconButton size="small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBoardForm({ id: b.id, name: b.name, description: b.description || '' }); setBoardDlg(true); }} sx={{ p: 0.25 }}>
                            <EditOutlinedIcon sx={{ fontSize: 16, color: '#BDBDBD' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir Quadro">
                          <IconButton size="small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBoard(b.id, e); }} sx={{ p: 0.25, color: '#D32F2F' }}>
                            <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    {b.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', opacity: 0.5 }}>Sem descrição</Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label="Kanban" size="small" sx={{ fontSize: '0.65rem', height: 20, backgroundColor: '#F7F5F5', color: '#6B6B6B' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Quadro */}
      <Dialog open={boardDlg} onClose={() => setBoardDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{boardForm.id ? 'Editar Quadro' : 'Novo Quadro'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome do quadro *" value={boardForm.name} onChange={e => setBoardForm(f => ({ ...f, name: e.target.value }))} fullWidth />
          <TextField label="Descrição (opcional)" value={boardForm.description} onChange={e => setBoardForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBoardDlg(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveBoard} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
