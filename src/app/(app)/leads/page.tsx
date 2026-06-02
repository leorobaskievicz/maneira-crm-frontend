'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LeadsPage() {
  const [boardData, setBoardData] = useState<any>(null);

  // Dialogs
  const [colDlg, setColDlg] = useState(false);
  const [cardDlg, setCardDlg] = useState(false);

  // Forms
  const [colForm, setColForm] = useState({ id: '', name: '', color: '#E0E0E0' });
  const [cardForm, setCardForm] = useState({ id: '', columnId: '', title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other' });

  // Load Active Board Data
  const loadBoardData = async () => {
    try {
      const r = await api.get('/boards');
      const leadsBoard = r.data.find((b: any) => b.name === 'Leads');
      if (leadsBoard) {
        const bd = await api.get(`/boards/${leadsBoard.id}`);
        setBoardData(bd.data);
      }
    } catch { }
  };

  useEffect(() => { loadBoardData(); }, []);

  // Columns CRUD
  const saveColumn = async () => {
    try {
      if (colForm.id) await api.put(`/board-columns/${colForm.id}`, colForm);
      else await api.post('/board-columns', { ...colForm, board: { id: boardData.id }, order: boardData.columns.length });
      toast.success('Coluna salva!'); setColDlg(false); loadBoardData();
    } catch { toast.error('Erro ao salvar coluna'); }
  };

  const deleteColumn = async (id: string) => {
    if (!confirm('Excluir esta coluna e todos os seus leads?')) return;
    try { await api.delete(`/board-columns/${id}`); loadBoardData(); }
    catch { toast.error('Erro'); }
  };

  // Cards CRUD
  const openCardDlg = (colId: string, card?: any) => {
    if (card) setCardForm({ ...card, columnId: colId, description: card.description || '', phone: card.phone || '', procedureInterest: card.procedureInterest || '', source: card.source || 'other' });
    else setCardForm({ id: '', columnId: colId, title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other' });
    setCardDlg(true);
  };

  const saveCard = async () => {
    if (!cardForm.title) return toast.error('Nome do lead é obrigatório');
    try {
      const data = { ...cardForm, column: { id: cardForm.columnId } };
      if (cardForm.id) await api.put(`/cards/${cardForm.id}`, data);
      else {
        const col = boardData.columns.find((c:any) => c.id === cardForm.columnId);
        await api.post('/cards', { ...data, order: col.cards?.length || 0 });
      }
      toast.success('Lead salvo!'); setCardDlg(false); loadBoardData();
    } catch { toast.error('Erro ao salvar'); }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Excluir lead?')) return;
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

  if (!boardData) return <Box sx={{ p: 3 }}><Typography>Carregando funil de leads...</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F5F5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Leads</Typography>
          <Typography variant="body2">Funil de prospecção de clientes</Typography>
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
                          <IconButton size="small" onClick={() => { setColForm({ id: col.id, name: col.name, color: col.color }); setColDlg(true); }}><EditOutlinedIcon fontSize="inherit" /></IconButton>
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
                                    {card.procedureInterest && <Typography variant="caption" sx={{ color: '#A0585A', display: 'block', mt: 0.5 }}>{card.procedureInterest}</Typography>}
                                    {card.phone && <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block' }}>{card.phone}</Typography>}
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {providedCard.placeholder}
                          </Box>
                        )}
                      </Droppable>
                      <Box sx={{ p: 1 }}>
                        <Button fullWidth startIcon={<AddOutlinedIcon />} sx={{ color: '#6B6B6B', justifyContent: 'flex-start' }} onClick={() => openCardDlg(col.id)}>Novo Lead</Button>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <Box sx={{ minWidth: 280, flexShrink: 0 }}>
                <Button fullWidth variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ height: 48, borderColor: '#D0D0D0', color: '#6B6B6B', backgroundColor: 'rgba(255,255,255,0.5)' }}
                  onClick={() => { setColForm({ id: '', name: '', color: '#A0585A' }); setColDlg(true); }}>Nova Etapa</Button>
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
        <DialogTitle>{cardForm.id ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome do Lead *" value={cardForm.title} onChange={e => setCardForm(f => ({ ...f, title: e.target.value }))} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Telefone" value={cardForm.phone} onChange={e => setCardForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
            <TextField label="Email" value={cardForm.email} onChange={e => setCardForm(f => ({ ...f, email: e.target.value }))} fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Procedimento de interesse" value={cardForm.procedureInterest} onChange={e => setCardForm(f => ({ ...f, procedureInterest: e.target.value }))} fullWidth />
            <FormControl fullWidth size="small">
              <InputLabel>Origem</InputLabel>
              <Select value={cardForm.source} label="Origem" onChange={e => setCardForm(f => ({ ...f, source: e.target.value }))}>
                {[['google','Google'],['instagram','Instagram'],['whatsapp','WhatsApp'],['referral','Indicação'],['other','Outro']].map(([k,v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Observações" value={cardForm.description} onChange={e => setCardForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
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
