'use client';
import { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Menu,
  ListItemIcon, ListItemText, Chip, Tooltip,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import api from '@/lib/api';
import { MaskedTextField } from '@/components/form/MaskedTextField';

type Variant = 'leads' | 'tasks';

interface KanbanBoardProps {
  board: any;
  setBoard: (b: any) => void;
  reload: () => void | Promise<void>;
  variant: Variant;
}

const COL_PALETTE = ['#A0585A', '#1976D2', '#F57C00', '#7B1FA2', '#388E3C', '#0288D1', '#9E9E9E', '#1A1A1A'];

const SOURCE_MAP: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: '#4285F4' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  referral: { label: 'Indicação', color: '#7B1FA2' },
  walk_in: { label: 'Espontâneo', color: '#00897B' },
  roleta: { label: 'Roleta', color: '#8E24AA' },
  other: { label: 'Outro', color: '#9E9E9E' },
};

const NOUNS: Record<Variant, { card: string; addCard: string }> = {
  leads: { card: 'Lead', addCard: 'Novo lead' },
  tasks: { card: 'Tarefa', addCard: 'Nova tarefa' },
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
function formatBRL(value: number): string {
  return brl.format(value || 0);
}

function sumColumnValue(col: any): number {
  return (col.cards || []).reduce((s: number, c: any) => s + Number(c.value || 0), 0);
}

function daysAgo(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86_400_000);
}

function whatsappLink(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}`;
}

export function KanbanBoard({ board, setBoard, reload, variant }: KanbanBoardProps) {
  const nouns = NOUNS[variant];

  const [colDlg, setColDlg] = useState(false);
  const [cardDlg, setCardDlg] = useState(false);
  const [colForm, setColForm] = useState<any>({ id: '', name: '', color: '#A0585A' });
  const [cardForm, setCardForm] = useState<any>({ id: '', columnId: '', title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other', value: '' });
  const [converting, setConverting] = useState(false);

  // ---- Colunas ----
  const openColDlg = (col?: any) => {
    setColForm(col ? { id: col.id, name: col.name, color: col.color || '#A0585A' } : { id: '', name: '', color: '#A0585A' });
    setColDlg(true);
  };

  const saveColumn = async () => {
    if (!colForm.name.trim()) return toast.error('Nome da etapa é obrigatório');
    try {
      if (colForm.id) await api.put(`/board-columns/${colForm.id}`, colForm);
      else await api.post('/board-columns', { ...colForm, board: { id: board.id }, order: board.columns.length });
      toast.success('Etapa salva!');
      setColDlg(false);
      reload();
    } catch { toast.error('Erro ao salvar etapa'); }
  };

  const deleteColumn = async (id: string) => {
    if (!confirm('Excluir esta etapa e todos os itens dentro dela?')) return;
    try { await api.delete(`/board-columns/${id}`); setColDlg(false); reload(); }
    catch { toast.error('Erro ao excluir etapa'); }
  };

  // ---- Cards ----
  const openCardDlg = (colId: string, card?: any) => {
    setCardForm(card
      ? { ...card, columnId: colId, description: card.description || '', phone: card.phone || '', email: card.email || '', procedureInterest: card.procedureInterest || '', source: card.source || 'other', value: card.value ?? '' }
      : { id: '', columnId: colId, title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other', value: '' });
    setCardDlg(true);
  };

  const saveCard = async () => {
    if (!cardForm.title.trim()) return toast.error(`${variant === 'leads' ? 'Nome do lead' : 'Título'} é obrigatório`);
    try {
      const value = cardForm.value === '' || cardForm.value == null ? null : Number(cardForm.value);
      const data = { ...cardForm, value, column: { id: cardForm.columnId } };
      if (cardForm.id) await api.put(`/cards/${cardForm.id}`, data);
      else {
        const col = board.columns.find((c: any) => c.id === cardForm.columnId);
        await api.post('/cards', { ...data, order: col?.cards?.length || 0 });
      }
      toast.success(`${nouns.card} salvo!`);
      setCardDlg(false);
      reload();
    } catch { toast.error('Erro ao salvar'); }
  };

  const deleteCard = async (id: string) => {
    if (!confirm(`Excluir ${nouns.card.toLowerCase()}?`)) return;
    try { await api.delete(`/cards/${id}`); setCardDlg(false); reload(); }
    catch { toast.error('Erro ao excluir'); }
  };

  // ---- Conversão lead -> paciente ----
  const convertToPatient = async () => {
    if (!cardForm.title.trim()) return toast.error('Nome do lead é obrigatório');
    setConverting(true);
    try {
      const notesParts = [
        cardForm.procedureInterest ? `Interesse: ${cardForm.procedureInterest}` : '',
        cardForm.source ? `Origem: ${SOURCE_MAP[cardForm.source]?.label || cardForm.source}` : '',
        cardForm.description || '',
      ].filter(Boolean);
      await api.post('/patients', {
        name: cardForm.title.trim(),
        phone: cardForm.phone || null,
        email: cardForm.email || null,
        notes: notesParts.join(' · ') || null,
      });
      toast.success('Lead convertido em paciente!');
      setCardDlg(false);
    } catch {
      toast.error('Erro ao converter em paciente');
    } finally {
      setConverting(false);
    }
  };

  // ---- Drag & Drop ----
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      const newCols = Array.from(board.columns);
      const [removed] = newCols.splice(source.index, 1);
      newCols.splice(destination.index, 0, removed);
      const updatedCols = newCols.map((c: any, i) => ({ ...c, order: i }));
      setBoard({ ...board, columns: updatedCols });
      try { await api.put('/board-columns/order', { columns: updatedCols.map((c: any) => ({ id: c.id, order: c.order })) }); }
      catch { reload(); }
      return;
    }

    const sourceCol = board.columns.find((c: any) => c.id === source.droppableId);
    const destCol = board.columns.find((c: any) => c.id === destination.droppableId);

    if (sourceCol === destCol) {
      const newCards = Array.from(sourceCol.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);
      const updatedCards = newCards.map((c: any, i) => ({ ...c, order: i }));
      const newCols = board.columns.map((c: any) => (c.id === sourceCol.id ? { ...c, cards: updatedCards } : c));
      setBoard({ ...board, columns: newCols });
      try { await api.put(`/cards/${(removed as any).id}/move`, { columnId: destCol.id, order: destination.index, otherCards: updatedCards.map((c: any) => ({ id: c.id, order: c.order })) }); }
      catch { reload(); }
    } else {
      const sourceCards = Array.from(sourceCol.cards);
      const destCards = Array.from(destCol.cards || []);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);
      const updatedSource = sourceCards.map((c: any, i) => ({ ...c, order: i }));
      const updatedDest = destCards.map((c: any, i) => ({ ...c, order: i }));
      const newCols = board.columns.map((c: any) => {
        if (c.id === sourceCol.id) return { ...c, cards: updatedSource };
        if (c.id === destCol.id) return { ...c, cards: updatedDest };
        return c;
      });
      setBoard({ ...board, columns: newCols });
      try { await api.put(`/cards/${(removed as any).id}/move`, { columnId: destCol.id, order: destination.index, otherCards: updatedDest.map((c: any) => ({ id: c.id, order: c.order })) }); }
      catch { reload(); }
    }
  };

  const isLeads = variant === 'leads';
  const totalLeads = isLeads ? board.columns.reduce((s: number, c: any) => s + (c.cards?.length || 0), 0) : 0;
  const totalPipeline = isLeads ? board.columns.reduce((s: number, c: any) => s + sumColumnValue(c), 0) : 0;

  return (
    <>
      {isLeads && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, backgroundColor: '#fff', border: '1px solid #EDE8E8', borderRadius: '12px', px: 2, py: 1.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#A0585A' }} />
            <Box>
              <Typography sx={{ fontSize: '0.66rem', color: '#9A9A9A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leads no funil</Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.1 }}>{totalLeads}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, backgroundColor: '#fff', border: '1px solid #EDE8E8', borderRadius: '12px', px: 2, py: 1.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#388E3C' }} />
            <Box>
              <Typography sx={{ fontSize: '0.66rem', color: '#9A9A9A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Em negociação</Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.1 }}>{formatBRL(totalPipeline)}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}
              sx={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', overflowY: 'hidden', pb: 1.5, alignItems: 'flex-start', minHeight: 0 }}>
              {board.columns.map((col: any, index: number) => (
                <Draggable key={col.id} draggableId={col.id} index={index}>
                  {(providedCol, snapshotCol) => (
                    <Box ref={providedCol.innerRef} {...providedCol.draggableProps}
                      sx={{
                        minWidth: 288, width: 288, maxHeight: '100%',
                        display: 'flex', flexDirection: 'column',
                        backgroundColor: '#F0ECEC', borderRadius: '12px',
                        border: '1px solid #E6DEDE',
                        boxShadow: snapshotCol.isDragging ? '0 12px 28px rgba(0,0,0,0.18)' : 'none',
                        transition: 'box-shadow .15s',
                      }}>
                      {/* Header da coluna */}
                      <Box sx={{ px: 1.25, py: 1.25, borderTop: `3px solid ${col.color || '#A0585A'}`, borderRadius: '12px 12px 0 0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box {...providedCol.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', color: '#B8AEAE', cursor: 'grab', '&:active': { cursor: 'grabbing' }, '&:hover': { color: '#7A6F6F' } }}>
                            <DragIndicatorIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#3A3232', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {col.name}
                          </Typography>
                          <Box sx={{ minWidth: 22, height: 20, px: 0.75, borderRadius: '10px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#8A7E7E' }}>{col.cards?.length || 0}</Typography>
                          </Box>
                          <ColMenu col={col} onEdit={() => openColDlg(col)} onDelete={() => deleteColumn(col.id)} />
                        </Box>
                        {isLeads && sumColumnValue(col) > 0 && (
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#7A6F6F', mt: 0.5, pl: 3 }}>
                            {formatBRL(sumColumnValue(col))}
                          </Typography>
                        )}
                      </Box>

                      {/* Cards */}
                      <Droppable droppableId={col.id} type="CARD">
                        {(providedCard, snapCard) => (
                          <Box ref={providedCard.innerRef} {...providedCard.droppableProps}
                            sx={{
                              px: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, minHeight: 24,
                              backgroundColor: snapCard.isDraggingOver ? 'rgba(160,88,90,0.06)' : 'transparent',
                              transition: 'background-color .15s',
                              '&::-webkit-scrollbar': { width: 5 },
                              '&::-webkit-scrollbar-thumb': { background: '#D6CCCC', borderRadius: 3 },
                            }}>
                            {(col.cards || []).map((card: any, idx: number) => (
                              <Draggable key={card.id} draggableId={card.id} index={idx}>
                                {(providedC, snapC) => (
                                  <Box ref={providedC.innerRef} {...providedC.draggableProps} {...providedC.dragHandleProps}
                                    onClick={() => openCardDlg(col.id, card)}
                                    sx={{
                                      backgroundColor: '#fff', p: 1.25, borderRadius: '10px',
                                      border: '1px solid #EDE8E8',
                                      boxShadow: snapC.isDragging ? '0 8px 20px rgba(0,0,0,0.16)' : '0 1px 2px rgba(0,0,0,0.04)',
                                      cursor: 'pointer',
                                      transition: 'box-shadow .12s, border-color .12s, transform .12s',
                                      '&:hover': { borderColor: '#D9C7C7', boxShadow: '0 3px 8px rgba(0,0,0,0.08)' },
                                    }}>
                                    {variant === 'leads'
                                      ? <LeadCardBody card={card} />
                                      : <TaskCardBody card={card} />}
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {providedCard.placeholder}
                          </Box>
                        )}
                      </Droppable>

                      <Box sx={{ p: 1 }}>
                        <Button fullWidth size="small" startIcon={<AddOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => openCardDlg(col.id)}
                          sx={{ color: '#8A7E7E', justifyContent: 'flex-start', fontWeight: 600, fontSize: '0.78rem', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#A0585A' } }}>
                          {nouns.addCard}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Nova etapa */}
              <Box sx={{ minWidth: 288, flexShrink: 0 }}>
                <Button fullWidth variant="outlined" startIcon={<AddOutlinedIcon />}
                  onClick={() => openColDlg()}
                  sx={{ height: 46, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', backgroundColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#A0585A', color: '#A0585A', backgroundColor: '#fff' } }}>
                  Nova etapa
                </Button>
              </Box>
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {/* Dialog Etapa */}
      <Dialog open={colDlg} onClose={() => setColDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{colForm.id ? 'Editar etapa' : 'Nova etapa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField label="Nome da etapa" value={colForm.name} onChange={(e) => setColForm((f: any) => ({ ...f, name: e.target.value }))} fullWidth autoFocus />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#6B6B6B' }}>Cor da etapa</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COL_PALETTE.map((c) => (
                <Box key={c} onClick={() => setColForm((f: any) => ({ ...f, color: c }))}
                  sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: colForm.color === c ? '3px solid #1A1A1A' : '3px solid transparent', boxShadow: '0 0 0 1px #EDE8E8', transition: 'transform .1s', '&:hover': { transform: 'scale(1.12)' } }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          {colForm.id && <Button color="error" onClick={() => deleteColumn(colForm.id)} sx={{ mr: 'auto' }}>Excluir</Button>}
          <Button onClick={() => setColDlg(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveColumn} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Card */}
      <Dialog open={cardDlg} onClose={() => setCardDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{cardForm.id ? `Editar ${nouns.card.toLowerCase()}` : nouns.addCard}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label={variant === 'leads' ? 'Nome do lead *' : 'Título da tarefa *'} value={cardForm.title} onChange={(e) => setCardForm((f: any) => ({ ...f, title: e.target.value }))} fullWidth autoFocus />
          {variant === 'leads' && (
            <>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <MaskedTextField mask="phone" label="Telefone / WhatsApp" value={cardForm.phone} onChange={(e) => setCardForm((f: any) => ({ ...f, phone: e.target.value }))} fullWidth />
                <TextField type="email" label="Email" value={cardForm.email} onChange={(e) => setCardForm((f: any) => ({ ...f, email: e.target.value }))} fullWidth />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Procedimento de interesse" value={cardForm.procedureInterest} onChange={(e) => setCardForm((f: any) => ({ ...f, procedureInterest: e.target.value }))} fullWidth />
                <FormControl fullWidth size="small">
                  <InputLabel>Origem</InputLabel>
                  <Select value={cardForm.source} label="Origem" onChange={(e) => setCardForm((f: any) => ({ ...f, source: e.target.value }))}>
                    {Object.entries(SOURCE_MAP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Valor potencial (R$)"
                type="number"
                value={cardForm.value}
                onChange={(e) => setCardForm((f: any) => ({ ...f, value: e.target.value }))}
                fullWidth
                slotProps={{ input: { inputProps: { min: 0, step: '0.01' } } }}
                helperText="Quanto esse lead pode gerar de receita se fechar"
              />
            </>
          )}
          <TextField label={variant === 'leads' ? 'Observações' : 'Descrição / Notas'} value={cardForm.description} onChange={(e) => setCardForm((f: any) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={variant === 'leads' ? 3 : 4} />
        </DialogContent>
        <DialogActions>
          {cardForm.id && <Button color="error" onClick={() => deleteCard(cardForm.id)} sx={{ mr: 'auto' }}>Excluir</Button>}
          {isLeads && cardForm.id && (
            <Button onClick={convertToPatient} disabled={converting} startIcon={<PersonAddAlt1OutlinedIcon fontSize="small" />} sx={{ color: '#388E3C' }}>
              {converting ? 'Convertendo…' : 'Converter em paciente'}
            </Button>
          )}
          <Button onClick={() => setCardDlg(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveCard} sx={{ backgroundColor: '#A0585A' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ColMenu({ col, onEdit, onDelete }: { col: any; onEdit: () => void; onDelete: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  return (
    <>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ color: '#A89E9E', p: 0.25 }}>
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onEdit(); }}>
          <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText>Editar etapa</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onDelete(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Excluir etapa</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function TaskCardBody({ card }: { card: any }) {
  return (
    <>
      <Typography sx={{ fontWeight: 600, fontSize: '0.84rem', color: '#1A1A1A', wordBreak: 'break-word' }}>{card.title}</Typography>
      {card.description && (
        <Typography variant="caption" sx={{ color: '#9A9A9A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 }}>
          {card.description}
        </Typography>
      )}
    </>
  );
}

function LeadCardBody({ card }: { card: any }) {
  const source = SOURCE_MAP[card.source] || SOURCE_MAP.other;
  const days = daysAgo(card.createdAt);
  const wa = whatsappLink(card.phone);
  const agingColor = days == null ? '#9A9A9A' : days >= 10 ? '#D32F2F' : days >= 5 ? '#F57C00' : '#9A9A9A';

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.84rem', color: '#1A1A1A', wordBreak: 'break-word', flex: 1 }}>{card.title}</Typography>
        {wa && (
          <Tooltip title="Abrir no WhatsApp">
            <IconButton size="small" component="a" href={wa} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0.4, color: '#25D366', backgroundColor: 'rgba(37,211,102,0.1)', '&:hover': { backgroundColor: 'rgba(37,211,102,0.2)' } }}>
              <WhatsAppIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {card.procedureInterest && (
        <Typography sx={{ fontSize: '0.74rem', color: '#A0585A', fontWeight: 600, mt: 0.5 }}>{card.procedureInterest}</Typography>
      )}
      {card.phone && (
        <Typography variant="caption" sx={{ color: '#9A9A9A', display: 'block', mt: 0.25 }}>{card.phone}</Typography>
      )}
      {Number(card.value) > 0 && (
        <Typography sx={{ fontSize: '0.78rem', color: '#388E3C', fontWeight: 700, mt: 0.5 }}>{formatBRL(Number(card.value))}</Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Chip label={source.label} size="small"
          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, color: source.color, backgroundColor: `${source.color}1A`, '& .MuiChip-label': { px: 0.75 } }} />
        {days != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: agingColor }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600 }}>
              {days === 0 ? 'Hoje' : days === 1 ? '1 dia' : `${days} dias`}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}
