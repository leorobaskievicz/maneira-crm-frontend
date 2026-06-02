'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function TarefasBoardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const boardId = params?.id;
  const [boardData, setBoardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [colDlg, setColDlg] = useState(false);
  const [cardDlg, setCardDlg] = useState(false);

  // Forms
  const [colForm, setColForm] = useState({ id: '', name: '', color: '#1A1A1A' });
  const [cardForm, setCardForm] = useState({ id: '', columnId: '', title: '', description: '' });

  // Load Active Board Data
  const loadBoardData = async () => {
    try {
      const r = await api.get(`/boards/${boardId}`);
      setBoardData(r.data);
    } catch { toast.error('Erro ao carregar quadro'); router.push('/tarefas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (boardId) loadBoardData(); }, [boardId]);

  // Columns CRUD
  const saveColumn = async () => {
    try {
      if (colForm.id) await api.put(`/board-columns/${colForm.id}`, colForm);
      else await api.post('/board-columns', { ...colForm, board: { id: boardData.id }, order: boardData.columns.length });
      toast.success('Coluna salva!'); setColDlg(false); loadBoardData();
    } catch { toast.error('Erro ao salvar coluna'); }
  };

  const deleteColumn = async (id: string) => {
    if (!confirm('Excluir esta coluna e todas as tarefas dentro dela?')) return;
    try { await api.delete(`/board-columns/${id}`); loadBoardData(); }
    catch { toast.error('Erro'); }
  };

  // Cards CRUD
  const openCardDlg = (colId: string, card?: any) => {
    if (card) setCardForm({ ...card, columnId: colId, description: card.description || '' });
    else setCardForm({ id: '', columnId: colId, title: '', description: '' });
    setCardDlg(true);
  };

  const saveCard = async () => {
    if (!cardForm.title) return toast.error('Título é obrigatório');
    try {
      const data = { ...cardForm, column: { id: cardForm.columnId } };
      if (cardForm.id) await api.put(`/cards/${cardForm.id}`, data);
      else {
        const col = boardData.columns.find((c:any) => c.id === cardForm.columnId);
        await api.post('/cards', { ...data, order: col.cards?.length || 0 });
      }
      toast.success('Tarefa salva!'); setCardDlg(false); loadBoardData();
    } catch { toast.error('Erro ao salvar'); }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Excluir tarefa?')) return;
    try { await api.delete(`/cards/${id}`); loadBoardData(); }
    catch { toast.error('Erro'); }
  };

  // Drag and Drop
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      const newCols = Array.from(boardData.columns);
      const [removed] = newCols.splice(source.index, 1);
      newCols.splice(destination.index, 0, removed);
      const updatedCols = newCols.map((c:any, i) => ({ ...c, order: i }));
      setBoardData({ ...boardData, columns: updatedCols });
      try { await api.put('/board-columns/order', { columns: updatedCols.map(c => ({ id: c.id, order: c.order })) }); } catch { loadBoardData(); }
      return;
    }

    const sourceCol = boardData.columns.find((c:any) => c.id === source.droppableId);
    const destCol = boardData.columns.find((c:any) => c.id === destination.droppableId);
    
    if (sourceCol === destCol) {
      const newCards = Array.from(sourceCol.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);
      const updatedCards = newCards.map((c:any, i) => ({ ...c, order: i }));
      const newCols = boardData.columns.map((c:any) => c.id === sourceCol.id ? { ...c, cards: updatedCards } : c);
      setBoardData({ ...boardData, columns: newCols });
      try { await api.put(`/cards/${(removed as any).id}/move`, { columnId: destCol.id, order: destination.index, otherCards: updatedCards.map(c => ({ id: c.id, order: c.order })) }); } catch { loadBoardData(); }
    } else {
      const sourceCards = Array.from(sourceCol.cards);
      const destCards = Array.from(destCol.cards || []);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);
      const updatedSource = sourceCards.map((c:any, i) => ({ ...c, order: i }));
      const updatedDest = destCards.map((c:any, i) => ({ ...c, order: i }));
      const newCols = boardData.columns.map((c:any) => {
        if (c.id === sourceCol.id) return { ...c, cards: updatedSource };
        if (c.id === destCol.id) return { ...c, cards: updatedDest };
        return c;
      });
      setBoardData({ ...boardData, columns: newCols });
      try { await api.put(`/cards/${(removed as any).id}/move`, { columnId: destCol.id, order: destination.index, otherCards: updatedDest.map(c => ({ id: c.id, order: c.order })) }); } catch { loadBoardData(); }
    }
  };

  const ColMenu = ({ col }: { col: any }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    return (
      <>
        <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)} sx={{ color: '#9E9E9E' }}><MoreVertIcon fontSize="small" /></IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => { setAnchorEl(null); setColForm({ id: col.id, name: col.name, color: col.color }); setColDlg(true); }}>
            <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); deleteColumn(col.id); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Excluir coluna</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  };

  if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F7F5F5' }}><CircularProgress sx={{ color: '#A0585A' }} /></Box>;
  if (!boardData) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F5F5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/tarefas')} sx={{ mr: 2, backgroundColor: '#fff', border: '1px solid #EDE8E8' }}>
          <ArrowBackOutlinedIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{boardData.name}</Typography>
          {boardData.description && <Typography variant="body2">{boardData.description}</Typography>}
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
              {boardData.columns.map((col: any, index: number) => (
                <Draggable key={col.id} draggableId={col.id} index={index}>
                  {(providedCol) => (
                    <Box ref={providedCol.innerRef} {...providedCol.draggableProps} sx={{ minWidth: 280, width: 280, backgroundColor: '#EDEDED', borderRadius: '8px', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                      <Box {...providedCol.dragHandleProps} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `4px solid ${col.color}`, borderRadius: '8px 8px 0 0' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{col.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600 }}>{col.cards?.length || 0}</Typography>
                          <ColMenu col={col} />
                        </Box>
                      </Box>
                      <Droppable droppableId={col.id} type="CARD">
                        {(providedCard) => (
                          <Box ref={providedCard.innerRef} {...providedCard.droppableProps} sx={{ p: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, minHeight: 40 }}>
                            {col.cards?.map((card: any, idx: number) => (
                              <Draggable key={card.id} draggableId={card.id} index={idx}>
                                {(providedC) => (
                                  <Box ref={providedC.innerRef} {...providedC.draggableProps} {...providedC.dragHandleProps}
                                    sx={{ backgroundColor: '#fff', p: 1.5, borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }}
                                    onClick={() => openCardDlg(col.id, card)}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-word' }}>{card.title}</Typography>
                                    {card.description && <Typography variant="caption" sx={{ color: '#9E9E9E', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 }}>{card.description}</Typography>}
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {providedCard.placeholder}
                          </Box>
                        )}
                      </Droppable>
                      <Box sx={{ p: 1 }}>
                        <Button fullWidth startIcon={<AddOutlinedIcon />} sx={{ color: '#6B6B6B', justifyContent: 'flex-start' }} onClick={() => openCardDlg(col.id)}>Nova tarefa</Button>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <Box sx={{ minWidth: 280, flexShrink: 0 }}>
                <Button fullWidth variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ height: 48, borderColor: '#D0D0D0', color: '#6B6B6B', backgroundColor: 'rgba(255,255,255,0.5)' }}
                  onClick={() => { setColForm({ id: '', name: '', color: '#1A1A1A' }); setColDlg(true); }}>Nova Etapa</Button>
              </Box>
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={colDlg} onClose={() => setColDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{colForm.id ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={colForm.name} onChange={e => setColForm(f => ({ ...f, name: e.target.value }))} fullWidth />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <input type="color" value={colForm.color} onChange={e => setColForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
            <Typography variant="body2">Cor do topo da coluna</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          {colForm.id && <Button color="error" onClick={() => deleteColumn(colForm.id)} sx={{ mr: 'auto' }}>Excluir</Button>}
          <Button onClick={() => setColDlg(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveColumn} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cardDlg} onClose={() => setCardDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{cardForm.id ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título da tarefa *" value={cardForm.title} onChange={e => setCardForm(f => ({ ...f, title: e.target.value }))} fullWidth />
          <TextField label="Descrição / Notas" value={cardForm.description} onChange={e => setCardForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={4} />
        </DialogContent>
        <DialogActions>
          {cardForm.id && <Button color="error" onClick={() => deleteCard(cardForm.id)} sx={{ mr: 'auto' }}>Excluir</Button>}
          <Button onClick={() => setCardDlg(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveCard} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
