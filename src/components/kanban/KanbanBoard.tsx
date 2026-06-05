'use client';
import { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Menu,
  ListItemIcon, ListItemText, Chip, Tooltip, Avatar,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/EmailOutlined';
import CloseIcon from '@mui/icons-material/Close';
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const TAG_PALETTE = ['#A0585A', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#0097A7', '#5D4037'];
function tagColor(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % TAG_PALETTE.length;
  return TAG_PALETTE[h];
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
  const [cardForm, setCardForm] = useState<any>({ id: '', columnId: '', title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other', value: '', tags: [] as string[] });
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
      ? { ...card, columnId: colId, description: card.description || '', phone: card.phone || '', email: card.email || '', procedureInterest: card.procedureInterest || '', source: card.source || 'other', value: card.value ?? '', tags: card.tags || [] }
      : { id: '', columnId: colId, title: '', description: '', phone: '', email: '', procedureInterest: '', source: 'other', value: '', tags: [] });
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
        <Box sx={{ display: 'flex', gap: 1.25, mb: 2 }}>
          {/* Total geral */}
          <Box sx={{ flex: 1, minWidth: 0, borderRadius: '12px', p: 1.5, color: '#fff', background: 'linear-gradient(135deg, #C4807F, #A0585A)', boxShadow: '0 4px 12px rgba(160,88,90,0.25)' }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>Funil total</Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, mt: 0.25 }}>{totalLeads} <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85 }}>leads</Typography></Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mt: 0.25 }}>{formatBRL(totalPipeline)}</Typography>
          </Box>

          {/* Um card por etapa */}
          {board.columns.map((col: any) => {
            const cc = col.color || '#A0585A';
            const count = col.cards?.length || 0;
            const val = sumColumnValue(col);
            const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <Box key={col.id} sx={{ flex: 1, minWidth: 0, backgroundColor: '#fff', border: '1px solid #EDE8E8', borderRadius: '12px', p: 1.5, borderTop: `3px solid ${cc}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cc, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8A7E7E', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>{count}</Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: '#B0A8A8', fontWeight: 600 }}>{pct}%</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: val > 0 ? '#2E7D32' : '#C9BFBF', mt: 0.25 }}>{formatBRL(val)}</Typography>
              </Box>
            );
          })}
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
                      {(() => { const cc = col.color || '#A0585A'; return (
                      <Box sx={{ px: 1.25, pt: 1.25, pb: 1, borderRadius: '12px 12px 0 0', background: `linear-gradient(180deg, ${cc}1A, transparent)`, borderTop: `3px solid ${cc}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Box {...providedCol.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', color: '#B8AEAE', cursor: 'grab', '&:active': { cursor: 'grabbing' }, '&:hover': { color: '#7A6F6F' } }}>
                            <DragIndicatorIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: cc, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#3A3232', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {col.name}
                          </Typography>
                          <Box sx={{ minWidth: 22, height: 20, px: 0.85, borderRadius: '10px', backgroundColor: `${cc}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: cc }}>{col.cards?.length || 0}</Typography>
                          </Box>
                          <ColMenu col={col} onEdit={() => openColDlg(col)} onDelete={() => deleteColumn(col.id)} />
                        </Box>
                        {isLeads && sumColumnValue(col) > 0 && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', mt: 0.75, ml: 3.1, px: 0.85, py: 0.15, borderRadius: '6px', backgroundColor: 'rgba(56,142,60,0.12)' }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#2E7D32' }}>{formatBRL(sumColumnValue(col))}</Typography>
                          </Box>
                        )}
                      </Box>
                      ); })()}

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
          <TagsField tags={cardForm.tags || []} onChange={(tags) => setCardForm((f: any) => ({ ...f, tags }))} />
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

function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
      {tags.map((t, i) => {
        const c = tagColor(t);
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.2, borderRadius: '6px', backgroundColor: `${c}14` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c }} />
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: c }}>{t}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function CardFooter({ card, aging }: { card: any; aging?: boolean }) {
  const created = formatDate(card.createdAt);
  const days = daysAgo(card.createdAt);
  const agingColor = days == null ? '#B0A8A8' : days >= 10 ? '#D32F2F' : days >= 5 ? '#F57C00' : '#B0A8A8';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 0.75, borderTop: '1px dashed #EFE9E9' }}>
      {created && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#B0A8A8' }}>
          <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 600 }}>{created}</Typography>
        </Box>
      )}
      {aging && days != null && days >= 3 && (
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: agingColor }}>
          {days === 1 ? '1 dia parado' : `${days} dias parado`}
        </Typography>
      )}
    </Box>
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
      <TagChips tags={card.tags} />
      <CardFooter card={card} />
    </>
  );
}

function LeadCardBody({ card }: { card: any }) {
  const source = SOURCE_MAP[card.source] || SOURCE_MAP.other;
  const wa = whatsappLink(card.phone);
  const initial = (card.title || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: '0.78rem', fontWeight: 700, bgcolor: source.color, flexShrink: 0 }}>{initial}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#1A1A1A', wordBreak: 'break-word', lineHeight: 1.25 }}>{card.title}</Typography>
          {card.procedureInterest && (
            <Typography sx={{ fontSize: '0.72rem', color: '#A0585A', fontWeight: 600 }}>{card.procedureInterest}</Typography>
          )}
        </Box>
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

      {(card.phone || card.email) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 0.75, color: '#9A9A9A' }}>
          {card.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <PhoneOutlinedIcon sx={{ fontSize: 12 }} />
              <Typography sx={{ fontSize: '0.7rem' }}>{card.phone}</Typography>
            </Box>
          )}
          {card.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, minWidth: 0 }}>
              <MailOutlineIcon sx={{ fontSize: 12 }} />
              <Typography sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.email}</Typography>
            </Box>
          )}
        </Box>
      )}

      {Number(card.value) > 0 && (
        <Typography sx={{ fontSize: '0.82rem', color: '#388E3C', fontWeight: 800, mt: 0.75 }}>{formatBRL(Number(card.value))}</Typography>
      )}

      <Box sx={{ mt: 0.75 }}>
        <Chip label={source.label} size="small"
          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, color: source.color, backgroundColor: `${source.color}1A`, '& .MuiChip-label': { px: 0.75 } }} />
      </Box>

      <TagChips tags={card.tags} />
      <CardFooter card={card} aging />
    </>
  );
}

function TagsField({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <Box>
      <TextField
        label="Etiquetas (tags)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        onBlur={add}
        fullWidth
        placeholder="Digite e tecle Enter (ex.: VIP, retorno, urgente)"
      />
      {tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {tags.map((t) => {
            const c = tagColor(t);
            return (
              <Chip key={t} label={t} size="small" onDelete={() => onChange(tags.filter((x) => x !== t))}
                deleteIcon={<CloseIcon />}
                sx={{ fontWeight: 600, color: c, backgroundColor: `${c}1A`, '& .MuiChip-deleteIcon': { color: c, fontSize: 14 } }} />
            );
          })}
        </Box>
      )}
    </Box>
  );
}
