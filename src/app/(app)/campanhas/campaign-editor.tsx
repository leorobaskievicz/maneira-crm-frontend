'use client';
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip,
  ToggleButtonGroup, ToggleButton, Switch, FormControlLabel, IconButton, Divider, Tooltip, Radio, Alert,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MaskedTextField } from '@/components/form/MaskedTextField';
import { PrizeWheel } from '@/components/PrizeWheel';
import { uploadImage } from '@/lib/upload';

// Chave do rascunho de criação salvo no navegador (autosave da modal "Nova Campanha")
const DRAFT_KEY = 'maneira-crm:campaign-draft';

const PROCEDURES = ['Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster','Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação','Radiofrequência','PEIM','HIFU Corporal','Corrente Russa','Depilação a Laser','Ledterapia','Intradermoterapia'];
const SLOT_PALETTE = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#FDD835', '#6D4C41'];

const defaultWheel = () => ({
  theme: '',
  backgroundImage: '',
  secondaryColor: '#1A1A1A',
  backgroundColor: '#0d0d0d',
  ctaBgColor: '#A0585A',
  ctaTextColor: '#ffffff',
  spinDurationMs: 5000,
  successTitle: 'Parabéns! 🎉',
  successMessage: 'Você ganhou:',
  scheduleMessage: 'Quero agendar minha avaliação e resgatar meu prêmio',
  onePerPerson: true,
  slots: [
    { label: '10% OFF', color: '#E53935', weight: 40 },
    { label: 'Brinde exclusivo', color: '#1E88E5', weight: 30 },
    { label: 'Avaliação grátis', color: '#43A047', weight: 20 },
    { label: 'Limpeza de pele', color: '#FB8C00', weight: 10 },
  ],
});

// Template inicial do Quiz — exemplo "Qual seu perfil de skincare?"
const defaultQuiz = () => ({
  mode: 'profile', // 'profile' (perfil mais escolhido) | 'score' (prêmio por nº de acertos)
  theme: '',
  logo: '',
  backgroundImage: '',
  storyImage: '', // imagem pronta que o lead posta nos Stories (obrigatória para resgatar o prêmio)
  secondaryColor: '#1A1A1A',
  backgroundColor: '#0d0d0d',
  ctaBgColor: '#A0585A',
  ctaTextColor: '#ffffff',
  introTitle: 'Descubra seu perfil e ganhe um prêmio 🎁',
  introSubtitle: 'São só algumas perguntas rápidas.',
  askInstagram: true,
  collectAtStart: true,
  onePerPerson: true,
  successTitle: 'Seu resultado',
  scheduleMessage: 'Quero agendar minha avaliação e resgatar meu prêmio',
  shareCaption: 'Acabei de descobrir meu perfil no quiz da Clínica Caroline Maneira! 💆‍♀️✨',
  shareHashtag: '@carolinemaneira',
  // Modo 'score': faixas de prêmio por acertos (ordenadas por minCorrect crescente)
  noPrizeTitle: 'Quase lá! 😅',
  noPrizeMessage: 'Você não atingiu a pontuação do prêmio, mas pode agendar sua avaliação com condição especial!',
  prizeTiers: [
    { minCorrect: 6, emoji: '🎉', label: '10% OFF', description: '' },
    { minCorrect: 8, emoji: '🔥', label: '20% OFF', description: '' },
    { minCorrect: 10, emoji: '🏆', label: 'R$ 200 de desconto', description: 'Pontuação máxima!' },
  ],
  results: [
    { key: 'r1', title: 'Pele Radiante', emoji: '✨', description: 'Sua pele pede manutenção e viço! Tratamentos de hidratação profunda vão te deixar ainda mais bonita.', prizeLabel: '20% OFF em Skinbooster', prizeDescription: '' },
    { key: 'r2', title: 'Pele Renovada', emoji: '🌸', description: 'Chegou a hora de renovar! Limpeza de pele e microagulhamento são ideais para o seu momento.', prizeLabel: 'Limpeza de Pele com 30% OFF', prizeDescription: '' },
    { key: 'r3', title: 'Pele Firme', emoji: '💎', description: 'Foco em firmeza e colágeno! Bioestimuladores e HIFU vão potencializar seus resultados.', prizeLabel: 'Avaliação + Bônus exclusivo', prizeDescription: '' },
  ],
  questions: [
    { text: 'Qual sua maior preocupação hoje?', image: '', correctIndex: 0, options: [
      { label: 'Hidratação e viço', resultKey: 'r1' },
      { label: 'Manchas e textura', resultKey: 'r2' },
      { label: 'Flacidez e firmeza', resultKey: 'r3' },
    ] },
    { text: 'Como você descreve sua rotina de cuidados?', image: '', correctIndex: 0, options: [
      { label: 'Básica, quero começar', resultKey: 'r1' },
      { label: 'Faço, mas quero melhorar', resultKey: 'r2' },
      { label: 'Cuido bastante e quero resultado', resultKey: 'r3' },
    ] },
    { text: 'Qual resultado você mais deseja?', image: '', correctIndex: 0, options: [
      { label: 'Pele iluminada', resultKey: 'r1' },
      { label: 'Pele uniforme', resultKey: 'r2' },
      { label: 'Efeito lifting', resultKey: 'r3' },
    ] },
  ],
});

const emptyForm = () => ({
  title: '', subtitle: '', campaignType: 'landing',
  ctaType: 'whatsapp', ctaText: 'Agendar pelo WhatsApp',
  whatsappNumber: '41984443694', primaryColor: '#A0585A',
  procedures: [] as string[], active: true,
  wheelConfig: defaultWheel(),
  quizConfig: defaultQuiz(),
});

interface Props { open: boolean; onClose: () => void; campaign?: any; }

export function CampaignEditor({ open, onClose, campaign }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [uploadingBg, setUploadingBg] = useState(false);
  // Sinaliza que um rascunho não salvo foi recuperado (mostra o aviso no topo da modal)
  const [draftRestored, setDraftRestored] = useState(false);

  // Apaga o rascunho persistido no navegador.
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  // Botão "Limpar": zera o formulário e descarta o rascunho.
  const handleClear = () => {
    setForm(emptyForm());
    clearDraft();
    setDraftRestored(false);
  };

  useEffect(() => {
    if (!open) return;
    if (campaign) {
      // Edição: sempre carrega da campanha (a modal de edição não usa rascunho).
      setDraftRestored(false);
      setForm({
        title: campaign.title, subtitle: campaign.subtitle || '',
        campaignType: campaign.campaignType || 'landing',
        ctaType: campaign.ctaType || 'whatsapp', ctaText: campaign.ctaText || 'Agendar pelo WhatsApp',
        whatsappNumber: campaign.whatsappNumber || '41984443694', primaryColor: campaign.primaryColor || '#A0585A',
        procedures: campaign.procedures || [], active: campaign.active,
        wheelConfig: { ...defaultWheel(), ...(campaign.wheelConfig || {}) },
        quizConfig: { ...defaultQuiz(), ...(campaign.quizConfig || {}) },
      });
      return;
    }
    // Criação: tenta recuperar um rascunho salvo de uma sessão anterior.
    let draft: any = null;
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) draft = JSON.parse(raw); } catch {}
    if (draft && typeof draft === 'object') {
      // Mescla com os defaults para tolerar mudanças de schema do rascunho antigo.
      setForm({
        ...emptyForm(), ...draft,
        wheelConfig: { ...defaultWheel(), ...(draft.wheelConfig || {}) },
        quizConfig: { ...defaultQuiz(), ...(draft.quizConfig || {}) },
      });
      setDraftRestored(true);
    } else {
      setForm(emptyForm());
      setDraftRestored(false);
    }
  }, [campaign, open]);

  // Autosave: grava o rascunho à medida que o usuário escreve (apenas na criação).
  // Debounce de 400ms; se o formulário voltar ao estado inicial, remove o rascunho.
  useEffect(() => {
    if (!open || campaign) return;
    const id = setTimeout(() => {
      try {
        const isPristine = JSON.stringify(form) === JSON.stringify(emptyForm());
        if (isPristine) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [form, open, campaign]);

  const isWheel = form.campaignType === 'wheel';
  const isQuiz = form.campaignType === 'quiz';
  const isLanding = form.campaignType === 'landing';
  const wheel = form.wheelConfig;
  const setWheel = (patch: any) => setForm((f) => ({ ...f, wheelConfig: { ...f.wheelConfig, ...patch } }));

  const quiz = form.quizConfig;
  const setQuiz = (patch: any) => setForm((f) => ({ ...f, quizConfig: { ...f.quizConfig, ...patch } }));

  // Upload genérico que devolve a URL (usado por logo do quiz, imagem de pergunta etc.)
  const uploadTo = async (e: React.ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      apply(url);
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      e.target.value = '';
    }
  };

  // Resultados do quiz
  const updateResult = (i: number, patch: any) => setQuiz({ results: quiz.results.map((r: any, idx: number) => idx === i ? { ...r, ...patch } : r) });
  const addResult = () => { const key = 'r' + (Date.now().toString(36)); setQuiz({ results: [...quiz.results, { key, title: 'Novo resultado', emoji: '🎁', description: '', prizeLabel: 'Prêmio', prizeDescription: '' }] }); };
  const removeResult = (i: number) => {
    if (quiz.results.length <= 1) return toast.error('O quiz precisa de ao menos 1 resultado');
    const removed = quiz.results[i];
    // Remove o resultado e reaponta opções órfãs para o primeiro resultado restante.
    const results = quiz.results.filter((_: any, idx: number) => idx !== i);
    const fallback = results[0].key;
    const questions = quiz.questions.map((q: any) => ({ ...q, options: q.options.map((o: any) => o.resultKey === removed.key ? { ...o, resultKey: fallback } : o) }));
    setQuiz({ results, questions });
  };

  // Perguntas do quiz
  const updateQuestion = (qi: number, patch: any) => setQuiz({ questions: quiz.questions.map((q: any, idx: number) => idx === qi ? { ...q, ...patch } : q) });
  const addQuestion = () => setQuiz({ questions: [...quiz.questions, { text: 'Nova pergunta', image: '', options: [{ label: 'Opção 1', resultKey: quiz.results[0]?.key }, { label: 'Opção 2', resultKey: quiz.results[Math.min(1, quiz.results.length - 1)]?.key }] }] });
  const removeQuestion = (qi: number) => { if (quiz.questions.length <= 1) return toast.error('O quiz precisa de ao menos 1 pergunta'); setQuiz({ questions: quiz.questions.filter((_: any, idx: number) => idx !== qi) }); };
  const updateOption = (qi: number, oi: number, patch: any) => updateQuestion(qi, { options: quiz.questions[qi].options.map((o: any, idx: number) => idx === oi ? { ...o, ...patch } : o) });
  const addOption = (qi: number) => updateQuestion(qi, { options: [...quiz.questions[qi].options, { label: 'Nova opção', resultKey: quiz.results[0]?.key }] });
  const removeOption = (qi: number, oi: number) => {
    if (quiz.questions[qi].options.length <= 2) return toast.error('Cada pergunta precisa de ao menos 2 opções');
    const q = quiz.questions[qi];
    // ao remover, reajusta o índice da resposta correta (modo acertos)
    let correctIndex = q.correctIndex ?? 0;
    if (oi === correctIndex) correctIndex = 0;
    else if (oi < correctIndex) correctIndex -= 1;
    updateQuestion(qi, { options: q.options.filter((_: any, idx: number) => idx !== oi), correctIndex });
  };
  const setCorrect = (qi: number, oi: number) => updateQuestion(qi, { correctIndex: oi });

  // Faixas de prêmio (modo 'score')
  const tiers = quiz.prizeTiers || [];
  const updateTier = (i: number, patch: any) => setQuiz({ prizeTiers: tiers.map((t: any, idx: number) => idx === i ? { ...t, ...patch } : t) });
  const addTier = () => setQuiz({ prizeTiers: [...tiers, { minCorrect: quiz.questions.length, emoji: '🎁', label: 'Prêmio', description: '' }] });
  const removeTier = (i: number) => setQuiz({ prizeTiers: tiers.filter((_: any, idx: number) => idx !== i) });

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const url = await uploadImage(file);
      setWheel({ backgroundImage: url });
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingBg(false);
      e.target.value = '';
    }
  };

  const addProc = (p: string) => { if (p && !form.procedures.includes(p)) setForm(f => ({ ...f, procedures: [...f.procedures, p] })); };
  const removeProc = (p: string) => setForm(f => ({ ...f, procedures: f.procedures.filter(x => x !== p) }));

  // Slots
  const updateSlot = (i: number, patch: any) => setWheel({ slots: wheel.slots.map((s: any, idx: number) => idx === i ? { ...s, ...patch } : s) });
  const addSlot = () => setWheel({ slots: [...wheel.slots, { label: 'Novo prêmio', color: SLOT_PALETTE[wheel.slots.length % SLOT_PALETTE.length], weight: 10 }] });
  const removeSlot = (i: number) => { if (wheel.slots.length <= 2) return toast.error('A roleta precisa de pelo menos 2 prêmios'); setWheel({ slots: wheel.slots.filter((_: any, idx: number) => idx !== i) }); };
  const totalWeight = wheel.slots.reduce((s: number, x: any) => s + (Number(x.weight) || 0), 0) || 1;

  const save = async () => {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    if (isWheel && wheel.slots.length < 2) { toast.error('Configure ao menos 2 prêmios'); return; }
    if (isQuiz) {
      if (quiz.questions.length < 1) { toast.error('Configure ao menos 1 pergunta'); return; }
      if (quiz.questions.some((q: any) => !q.options || q.options.length < 2)) { toast.error('Cada pergunta precisa de ao menos 2 opções'); return; }
      if (quiz.mode === 'score') {
        if (!quiz.prizeTiers || quiz.prizeTiers.length < 1) { toast.error('Configure ao menos 1 faixa de prêmio'); return; }
      } else {
        if (quiz.results.length < 1) { toast.error('Configure ao menos 1 resultado'); return; }
      }
    }
    const payload = { ...form, wheelConfig: isWheel ? wheel : null, quizConfig: isQuiz ? quiz : null };
    try {
      if (campaign) await api.put(`/campaigns/${campaign.id}`, payload);
      else await api.post('/campaigns', payload);
      clearDraft(); // sucesso: descarta o rascunho salvo
      setDraftRestored(false);
      toast.success(campaign ? 'Campanha atualizada!' : 'Campanha criada!');
      onClose();
    } catch { toast.error('Erro ao salvar'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
      <DialogContent>
        {draftRestored && !campaign && (
          <Alert severity="info" sx={{ mb: 1.5, mt: 0.5 }}
            action={<Button color="inherit" size="small" onClick={handleClear}>Descartar</Button>}>
            Recuperamos um rascunho não salvo — você pode continuar de onde parou.
          </Alert>
        )}
        {/* Tipo de campanha */}
        <ToggleButtonGroup
          exclusive value={form.campaignType}
          onChange={(_, v) => v && setForm(f => ({ ...f, campaignType: v }))}
          fullWidth sx={{ mt: 1, mb: 2 }}
        >
          <ToggleButton value="landing" sx={{ gap: 1, py: 1.25 }}><CampaignOutlinedIcon fontSize="small" /> Landing Page</ToggleButton>
          <ToggleButton value="wheel" sx={{ gap: 1, py: 1.25 }}><CasinoOutlinedIcon fontSize="small" /> Roleta</ToggleButton>
          <ToggleButton value="quiz" sx={{ gap: 1, py: 1.25 }}><QuizOutlinedIcon fontSize="small" /> Quiz</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={3}>
          {/* Coluna esquerda — formulário */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Título *" fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <TextField label="Subtítulo" fullWidth multiline rows={2} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />

              <Grid container spacing={2}>
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      style={{ width: 40, height: 40, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2 }} />
                    <TextField size="small" label="Cor principal" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} sx={{ flex: 1 }} />
                  </Box>
                </Grid>
                <Grid size={6}>
                  <MaskedTextField mask="phone" label="WhatsApp da clínica" fullWidth value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
                </Grid>
              </Grid>

              {isLanding && (
                <>
                  <Box>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Adicionar procedimento</InputLabel>
                      <Select value="" label="Adicionar procedimento" onChange={e => addProc(e.target.value)}>
                        {PROCEDURES.filter(p => !form.procedures.includes(p)).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {form.procedures.map(p => (
                        <Chip key={p} label={p} size="small" onDelete={() => removeProc(p)} variant="outlined" sx={{ fontSize: '0.75rem', borderColor: '#A0585A55', color: '#A0585A' }} />
                      ))}
                    </Box>
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de CTA</InputLabel>
                    <Select value={form.ctaType} label="Tipo de CTA" onChange={e => setForm(f => ({ ...f, ctaType: e.target.value }))}>
                      <MenuItem value="whatsapp">Botão WhatsApp</MenuItem>
                      <MenuItem value="form">Formulário</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Texto do botão" fullWidth value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} />
                </>
              )}

              {isWheel && (
                <>
                  <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>CONFIGURAÇÃO DA ROLETA</Typography></Divider>
                  <Grid container spacing={2}>
                    <Grid size={6}><TextField label="Tema (ex: Copa do Mundo)" fullWidth size="small" value={wheel.theme} onChange={e => setWheel({ theme: e.target.value })} /></Grid>
                    <Grid size={6}><TextField label="Tempo de giro (ms)" type="number" fullWidth size="small" value={wheel.spinDurationMs} onChange={e => setWheel({ spinDurationMs: Number(e.target.value) })} /></Grid>
                  </Grid>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B' }}>Imagem de fundo (tema)</Typography>
                    {wheel.backgroundImage ? (
                      <Box sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8' }}>
                        <Box component="img" src={wheel.backgroundImage} alt="Fundo" sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                        <Tooltip title="Remover imagem">
                          <IconButton size="small" onClick={() => setWheel({ backgroundImage: '' })}
                            sx={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' } }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button component="label" variant="outlined" fullWidth disabled={uploadingBg}
                        startIcon={<CloudUploadOutlinedIcon />}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', '&:hover': { borderColor: '#A0585A', color: '#A0585A' } }}>
                        {uploadingBg ? 'Enviando…' : 'Selecionar imagem'}
                        <input hidden type="file" accept="image/*" onChange={handleBgUpload} />
                      </Button>
                    )}
                  </Box>

                  {/* Cores da landing */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: '#6B6B6B', fontWeight: 600 }}>Cores</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <ColorBox label="Secundária" value={wheel.secondaryColor} onChange={(v) => setWheel({ secondaryColor: v })} />
                      <ColorBox label="Fundo" value={wheel.backgroundColor} onChange={(v) => setWheel({ backgroundColor: v })} />
                      <ColorBox label="CTA · fundo" value={wheel.ctaBgColor} onChange={(v) => setWheel({ ctaBgColor: v })} />
                      <ColorBox label="CTA · texto" value={wheel.ctaTextColor} onChange={(v) => setWheel({ ctaTextColor: v })} />
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={6}><TextField label="Título da conclusão" fullWidth size="small" value={wheel.successTitle} onChange={e => setWheel({ successTitle: e.target.value })} /></Grid>
                    <Grid size={6}><TextField label="Mensagem da conclusão" fullWidth size="small" value={wheel.successMessage} onChange={e => setWheel({ successMessage: e.target.value })} /></Grid>
                  </Grid>
                  <TextField label="Mensagem do WhatsApp (agendar)" fullWidth size="small" value={wheel.scheduleMessage} onChange={e => setWheel({ scheduleMessage: e.target.value })} />
                  <FormControlLabel
                    control={<Switch checked={!!wheel.onePerPerson} onChange={e => setWheel({ onePerPerson: e.target.checked })} />}
                    label={<Typography variant="body2">Permitir apenas 1 giro por WhatsApp</Typography>}
                  />

                  {/* Editor de prêmios */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Prêmios ({wheel.slots.length})</Typography>
                      <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addSlot} sx={{ color: '#A0585A' }}>Adicionar</Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {wheel.slots.map((slot: any, i: number) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input type="color" value={slot.color} onChange={e => updateSlot(i, { color: e.target.value })}
                            style={{ width: 34, height: 34, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2, flexShrink: 0 }} />
                          <TextField size="small" placeholder="Prêmio" value={slot.label} onChange={e => updateSlot(i, { label: e.target.value })} sx={{ flex: 1 }} />
                          <TextField size="small" type="number" label="Peso" value={slot.weight} onChange={e => updateSlot(i, { weight: Number(e.target.value) })} sx={{ width: 88 }} />
                          <Typography variant="caption" sx={{ width: 38, color: '#9A9A9A', textAlign: 'right' }}>
                            {Math.round(((Number(slot.weight) || 0) / totalWeight) * 100)}%
                          </Typography>
                          <IconButton size="small" onClick={() => removeSlot(i)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#9A9A9A', mt: 1, display: 'block' }}>
                      O “peso” define a chance de cada prêmio sair. Quanto maior, mais provável.
                    </Typography>
                  </Box>
                </>
              )}

              {isQuiz && (
                <>
                  <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>CONFIGURAÇÃO DO QUIZ</Typography></Divider>

                  {/* Modo de resultado */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B', fontWeight: 600 }}>Como o prêmio é definido</Typography>
                    <ToggleButtonGroup exclusive fullWidth size="small" value={quiz.mode || 'profile'}
                      onChange={(_, v) => v && setQuiz({ mode: v })}>
                      <ToggleButton value="profile" sx={{ textTransform: 'none', py: 1 }}>Por perfil (mais escolhido)</ToggleButton>
                      <ToggleButton value="score" sx={{ textTransform: 'none', py: 1 }}>Por nº de acertos</ToggleButton>
                    </ToggleButtonGroup>
                    <Typography variant="caption" sx={{ color: '#9A9A9A', mt: 0.5, display: 'block' }}>
                      {quiz.mode === 'score'
                        ? 'Cada pergunta tem uma resposta certa. O prêmio sai por faixa de acertos.'
                        : 'Cada resposta aponta para um perfil. O perfil mais escolhido vence.'}
                    </Typography>
                  </Box>

                  {/* Tela inicial */}
                  <TextField label="Tema (opcional, ex: Skincare)" fullWidth size="small" value={quiz.theme} onChange={e => setQuiz({ theme: e.target.value })} />
                  <TextField label="Título da tela inicial" fullWidth size="small" value={quiz.introTitle} onChange={e => setQuiz({ introTitle: e.target.value })} />
                  <TextField label="Subtítulo da tela inicial" fullWidth size="small" value={quiz.introSubtitle} onChange={e => setQuiz({ introSubtitle: e.target.value })} />

                  {/* Logo para a arte de Stories */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B' }}>Logo da clínica (aparece na arte dos Stories)</Typography>
                    {quiz.logo ? (
                      <Box sx={{ position: 'relative', display: 'inline-block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8', backgroundColor: '#222', p: 1 }}>
                        <Box component="img" src={quiz.logo} alt="Logo" sx={{ height: 64, display: 'block' }} />
                        <Tooltip title="Remover logo">
                          <IconButton size="small" onClick={() => setQuiz({ logo: '' })}
                            sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' } }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadOutlinedIcon />}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', '&:hover': { borderColor: '#A0585A', color: '#A0585A' } }}>
                        Enviar logo
                        <input hidden type="file" accept="image/*" onChange={(e) => uploadTo(e, (url) => setQuiz({ logo: url }))} />
                      </Button>
                    )}
                  </Box>

                  {/* Imagem de fundo */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B' }}>Imagem de fundo (opcional)</Typography>
                    {quiz.backgroundImage ? (
                      <Box sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8' }}>
                        <Box component="img" src={quiz.backgroundImage} alt="Fundo" sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                        <Tooltip title="Remover imagem">
                          <IconButton size="small" onClick={() => setQuiz({ backgroundImage: '' })}
                            sx={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' } }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadOutlinedIcon />}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', '&:hover': { borderColor: '#A0585A', color: '#A0585A' } }}>
                        Selecionar imagem
                        <input hidden type="file" accept="image/*" onChange={(e) => uploadTo(e, (url) => setQuiz({ backgroundImage: url }))} />
                      </Button>
                    )}
                  </Box>

                  {/* Cores */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: '#6B6B6B', fontWeight: 600 }}>Cores</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <ColorBox label="Secundária" value={quiz.secondaryColor} onChange={(v) => setQuiz({ secondaryColor: v })} />
                      <ColorBox label="Fundo" value={quiz.backgroundColor} onChange={(v) => setQuiz({ backgroundColor: v })} />
                      <ColorBox label="CTA · fundo" value={quiz.ctaBgColor} onChange={(v) => setQuiz({ ctaBgColor: v })} />
                      <ColorBox label="CTA · texto" value={quiz.ctaTextColor} onChange={(v) => setQuiz({ ctaTextColor: v })} />
                    </Box>
                  </Box>

                  <FormControlLabel
                    control={<Switch checked={!!quiz.askInstagram} onChange={e => setQuiz({ askInstagram: e.target.checked })} />}
                    label={<Typography variant="body2">Pedir @ do Instagram (opcional, ajuda a repostar o lead)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={!!quiz.onePerPerson} onChange={e => setQuiz({ onePerPerson: e.target.checked })} />}
                    label={<Typography variant="body2">Permitir apenas 1 resposta por WhatsApp</Typography>}
                  />

                  {/* Modo PERFIL — resultados / perfis */}
                  {quiz.mode !== 'score' && (
                    <>
                      <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>RESULTADOS E PRÊMIOS</Typography></Divider>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Resultados ({quiz.results.length})</Typography>
                        <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addResult} sx={{ color: '#A0585A' }}>Adicionar</Button>
                      </Box>
                      {quiz.results.map((r: any, i: number) => (
                        <Box key={r.key} sx={{ border: '1px solid #EDE8E8', borderRadius: '8px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField size="small" label="Emoji" value={r.emoji || ''} onChange={e => updateResult(i, { emoji: e.target.value })} sx={{ width: 80 }} />
                            <TextField size="small" label="Título do resultado" value={r.title} onChange={e => updateResult(i, { title: e.target.value })} sx={{ flex: 1 }} />
                            <IconButton size="small" onClick={() => removeResult(i)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                          </Box>
                          <TextField size="small" label="Descrição / recomendação" multiline rows={2} value={r.description} onChange={e => updateResult(i, { description: e.target.value })} fullWidth />
                          <TextField size="small" label="Prêmio deste resultado" value={r.prizeLabel} onChange={e => updateResult(i, { prizeLabel: e.target.value })} fullWidth />
                        </Box>
                      ))}
                    </>
                  )}

                  {/* Modo ACERTOS — faixas de prêmio por pontuação */}
                  {quiz.mode === 'score' && (
                    <>
                      <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>FAIXAS DE PRÊMIO (POR ACERTOS)</Typography></Divider>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Faixas ({tiers.length}) · {quiz.questions.length} perguntas no total</Typography>
                        <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addTier} sx={{ color: '#A0585A' }}>Adicionar</Button>
                      </Box>
                      {tiers.map((t: any, i: number) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #EDE8E8', borderRadius: '8px', p: 1 }}>
                          <TextField size="small" type="number" label="Acertos ≥" value={t.minCorrect}
                            onChange={e => updateTier(i, { minCorrect: Math.max(0, Number(e.target.value)) })}
                            sx={{ width: 96 }} slotProps={{ htmlInput: { min: 0, max: quiz.questions.length } }} />
                          <TextField size="small" label="Emoji" value={t.emoji || ''} onChange={e => updateTier(i, { emoji: e.target.value })} sx={{ width: 72 }} />
                          <TextField size="small" label="Prêmio" value={t.label} onChange={e => updateTier(i, { label: e.target.value })} sx={{ flex: 1 }} />
                          <IconButton size="small" onClick={() => removeTier(i)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                        </Box>
                      ))}
                      <Typography variant="caption" sx={{ color: '#9A9A9A', display: 'block' }}>
                        Quem fizer menos acertos que a menor faixa não ganha prêmio (mostra a mensagem abaixo). Ex.: faixas em 6, 8 e 10 → 0–5 não ganha, 6–7 a 1ª, 8–9 a 2ª, 10 a 3ª.
                      </Typography>
                      {tiers.length > 0 && Math.min(...tiers.map((t: any) => Number(t.minCorrect) || 0)) <= 0 && (
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                          A menor faixa está em <b>0 acertos</b> — assim <b>todo mundo ganha</b>, mesmo errando tudo.
                          Se você quer que o prêmio seja um desafio, suba o mínimo (ex.: “Acertos ≥ 3”).
                        </Alert>
                      )}
                      <TextField label="Título quando não ganha" fullWidth size="small" value={quiz.noPrizeTitle} onChange={e => setQuiz({ noPrizeTitle: e.target.value })} />
                      <TextField label="Mensagem quando não ganha" fullWidth size="small" multiline rows={2} value={quiz.noPrizeMessage} onChange={e => setQuiz({ noPrizeMessage: e.target.value })} />
                    </>
                  )}

                  {/* Perguntas */}
                  <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>PERGUNTAS</Typography></Divider>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Perguntas ({quiz.questions.length})</Typography>
                    <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addQuestion} sx={{ color: '#A0585A' }}>Adicionar</Button>
                  </Box>
                  {quiz.questions.map((q: any, qi: number) => (
                    <Box key={qi} sx={{ border: '1px solid #EDE8E8', borderRadius: '8px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#A0585A', flexShrink: 0 }}>#{qi + 1}</Typography>
                        <TextField size="small" label="Pergunta" value={q.text} onChange={e => updateQuestion(qi, { text: e.target.value })} sx={{ flex: 1 }} />
                        <IconButton size="small" onClick={() => removeQuestion(qi)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                      </Box>
                      {q.options.map((o: any, oi: number) => (
                        <Box key={oi} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: quiz.mode === 'score' ? 0 : 2 }}>
                          {quiz.mode === 'score' && (
                            <Tooltip title="Marcar como resposta correta">
                              <Radio size="small" checked={(q.correctIndex ?? 0) === oi} onChange={() => setCorrect(qi, oi)} sx={{ color: '#43A047', '&.Mui-checked': { color: '#43A047' } }} />
                            </Tooltip>
                          )}
                          <TextField size="small" placeholder="Opção" value={o.label} onChange={e => updateOption(qi, oi, { label: e.target.value })} sx={{ flex: 1 }} />
                          {quiz.mode !== 'score' && (
                            <FormControl size="small" sx={{ width: 170 }}>
                              <InputLabel>Aponta para</InputLabel>
                              <Select label="Aponta para" value={o.resultKey || ''} onChange={e => updateOption(qi, oi, { resultKey: e.target.value })}>
                                {quiz.results.map((r: any) => <MenuItem key={r.key} value={r.key}>{r.emoji} {r.title}</MenuItem>)}
                              </Select>
                            </FormControl>
                          )}
                          <IconButton size="small" onClick={() => removeOption(qi, oi)} sx={{ color: '#D32F2F' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<AddOutlinedIcon />} onClick={() => addOption(qi)} sx={{ color: '#A0585A', alignSelf: 'flex-start', ml: quiz.mode === 'score' ? 0 : 2 }}>Opção</Button>
                    </Box>
                  ))}
                  <Typography variant="caption" sx={{ color: '#9A9A9A', display: 'block' }}>
                    {quiz.mode === 'score'
                      ? 'Marque a bolinha verde na resposta correta de cada pergunta. O total de acertos define a faixa de prêmio.'
                      : 'Cada opção aponta para um resultado. O resultado mais escolhido nas respostas é o que o lead recebe (junto com o prêmio).'}
                  </Typography>

                  {/* Mensagens / compartilhamento */}
                  <Divider textAlign="left"><Typography variant="caption" sx={{ color: '#9A9A9A', fontWeight: 700 }}>FINAL E COMPARTILHAMENTO</Typography></Divider>

                  {/* Imagem pronta para o lead postar nos Stories (obrigatória p/ resgatar o prêmio) */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: '#6B6B6B' }}>
                      Imagem dos Stories (a pessoa precisa postar esta arte para resgatar o prêmio)
                    </Typography>
                    {quiz.storyImage ? (
                      <Box sx={{ position: 'relative', display: 'inline-block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8' }}>
                        <Box component="img" src={quiz.storyImage} alt="Story" sx={{ height: 160, display: 'block' }} />
                        <Tooltip title="Remover imagem">
                          <IconButton size="small" onClick={() => setQuiz({ storyImage: '' })}
                            sx={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' } }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadOutlinedIcon />}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderColor: '#D9CFCF', color: '#8A7E7E', '&:hover': { borderColor: '#A0585A', color: '#A0585A' } }}>
                        Enviar imagem do Story
                        <input hidden type="file" accept="image/*" onChange={(e) => uploadTo(e, (url) => setQuiz({ storyImage: url }))} />
                      </Button>
                    )}
                    <Typography variant="caption" sx={{ color: '#9A9A9A', mt: 0.75, display: 'block' }}>
                      Use uma arte vertical (proporção 9:16, ex.: 1080×1920). Se ficar vazio, geramos uma arte automática com o resultado do lead.
                    </Typography>
                  </Box>

                  <TextField label="Título da tela de resultado" fullWidth size="small" value={quiz.successTitle} onChange={e => setQuiz({ successTitle: e.target.value })} />
                  <TextField label="Mensagem do WhatsApp (agendar/resgatar)" fullWidth size="small" value={quiz.scheduleMessage} onChange={e => setQuiz({ scheduleMessage: e.target.value })} />
                  <TextField label="Legenda sugerida ao compartilhar nos Stories" fullWidth size="small" multiline rows={2} value={quiz.shareCaption} onChange={e => setQuiz({ shareCaption: e.target.value })} />
                  <TextField label="@ da clínica (aparece na arte)" fullWidth size="small" value={quiz.shareHashtag} onChange={e => setQuiz({ shareHashtag: e.target.value })} />
                </>
              )}

              <FormControlLabel
                control={<Switch checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />}
                label={<Typography variant="body2">Campanha ativa</Typography>}
              />
            </Box>
          </Grid>

          {/* Coluna direita — preview */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Preview</Typography>
            {isWheel ? (
              <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #EDE8E8', p: 2, textAlign: 'center',
                background: wheel.backgroundImage
                  ? `linear-gradient(180deg, ${wheel.backgroundColor}CC, ${wheel.backgroundColor}F2), url(${wheel.backgroundImage})`
                  : `linear-gradient(165deg, ${form.primaryColor} 0%, ${wheel.secondaryColor} 55%, ${wheel.backgroundColor} 100%)`,
                backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {wheel.theme && <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{wheel.theme}</Typography>}
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', mb: 1.5 }}>{form.title || 'Título'}</Typography>
                <PrizeWheel slots={wheel.slots} targetIndex={null} size={230} />
                <Box sx={{ mt: 2, py: 1, borderRadius: '8px', backgroundColor: wheel.ctaBgColor }}>
                  <Typography sx={{ color: wheel.ctaTextColor, fontWeight: 800, fontSize: '0.85rem' }}>🎯 GIRAR A ROLETA</Typography>
                </Box>
              </Box>
            ) : isQuiz ? (
              <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #EDE8E8', p: 2.5, textAlign: 'center',
                background: quiz.backgroundImage
                  ? `linear-gradient(180deg, ${quiz.backgroundColor}D9, ${quiz.backgroundColor}F2), url(${quiz.backgroundImage})`
                  : `linear-gradient(165deg, ${form.primaryColor} 0%, ${quiz.secondaryColor} 55%, ${quiz.backgroundColor} 100%)`,
                backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {quiz.logo && <Box component="img" src={quiz.logo} alt="logo" sx={{ height: 40, mb: 1.5, mx: 'auto', display: 'block' }} />}
                {quiz.theme && <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{quiz.theme}</Typography>}
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>{form.title || 'Título do quiz'}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', mb: 2 }}>{quiz.introTitle}</Typography>
                <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                  {(quiz.questions[0]?.options || []).slice(0, 3).map((o: any, i: number) => (
                    <Box key={i} sx={{ px: 1.5, py: 1, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <Typography sx={{ color: '#fff', fontSize: '0.78rem' }}>{o.label}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ py: 1, borderRadius: '8px', backgroundColor: quiz.ctaBgColor }}>
                  <Typography sx={{ color: quiz.ctaTextColor, fontWeight: 800, fontSize: '0.85rem' }}>Começar o quiz</Typography>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', mt: 1.5 }}>
                  {quiz.questions.length} pergunta(s) · {quiz.results.length} resultado(s) · botão de Stories no final
                </Typography>
              </Box>
            ) : (
              <Box sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #EDE8E8', backgroundColor: '#111' }}>
                <Box sx={{ p: 2.5, textAlign: 'center', backgroundColor: form.primaryColor }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>Clínica Caroline Maneira</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{form.title || 'Título da campanha'}</Typography>
                  {form.subtitle && <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', mt: 0.75 }}>{form.subtitle}</Typography>}
                </Box>
                <Box sx={{ p: 2 }}>
                  {form.procedures.slice(0, 3).map(p => (
                    <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: form.primaryColor, flexShrink: 0 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{p}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 1.5, py: 1.25, textAlign: 'center', borderRadius: '4px', backgroundColor: form.ctaType === 'whatsapp' ? '#25D366' : form.primaryColor }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{form.ctaType === 'whatsapp' ? '💬 ' : ''}{form.ctaText}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {!campaign && (
          <Button onClick={handleClear} sx={{ color: '#9A7E7E', mr: 'auto' }}>Limpar</Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={save} sx={{ backgroundColor: '#A0585A' }}>
          {campaign ? 'Salvar alterações' : 'Criar campanha'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ColorBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 32, border: '1px solid #EDE8E8', borderRadius: 4, cursor: 'pointer', padding: 2, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: '#6B6B6B' }}>{label}</Typography>
    </Box>
  );
}
