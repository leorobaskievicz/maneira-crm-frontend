'use client';
import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { toast } from 'sonner';
import { onlyDigits, maskPhone } from '@/lib/masks';
import { buildStoryArt } from './storyArt';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface QuizResult {
  key: string; title: string; description: string;
  prizeLabel: string; prizeDescription?: string; image?: string; emoji?: string;
}

export function QuizLanding({ campaign, slug }: { campaign: any; slug: string }) {
  const cfg = campaign.quizConfig || {};
  const questions = cfg.questions || [];
  const color = campaign.primaryColor || '#A0585A';
  const secondary = cfg.secondaryColor || '#1A1A1A';
  const background = cfg.backgroundColor || '#0d0d0d';
  const ctaBg = cfg.ctaBgColor || color;
  const ctaText = cfg.ctaTextColor || '#ffffff';

  // Passos: 'intro' (dados) → 'quiz' (perguntas) → 'result'
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [form, setForm] = useState({ name: '', phone: '', instagram: '' });
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [sharing, setSharing] = useState(false);
  const artUrlRef = useRef<string | null>(null);

  const bg = cfg.backgroundImage
    ? `linear-gradient(180deg, ${background}D9, ${background}F2), url(${cfg.backgroundImage})`
    : `linear-gradient(165deg, ${color} 0%, ${secondary} 55%, ${background} 100%)`;

  const progress = questions.length ? Math.round(((phase === 'result' ? questions.length : qIndex) / questions.length) * 100) : 0;

  const startQuiz = () => {
    if (!form.name.trim()) return toast.error('Informe seu nome');
    if (onlyDigits(form.phone).length < 10) return toast.error('Informe um WhatsApp válido');
    setPhase('quiz');
  };

  const choose = async (optionIndex: number) => {
    const next = [...answers];
    next[qIndex] = optionIndex;
    setAnswers(next);
    if (qIndex < questions.length - 1) {
      // pequeno respiro visual antes de avançar
      setTimeout(() => setQIndex(qIndex + 1), 180);
    } else {
      await submit(next);
    }
  };

  const submit = async (finalAnswers: number[]) => {
    setSubmitting(true);
    try {
      const r = await axios.post(`${API}/public/campaigns/${slug}/quiz`, {
        name: form.name.trim(),
        phone: form.phone,
        instagram: form.instagram,
        answers: finalAnswers,
      });
      setResult(r.data.result);
      setPhase('result');
    } catch {
      toast.error('Não foi possível enviar suas respostas. Tente novamente.');
      setSubmitting(false);
    }
  };

  const scheduleWhatsApp = () => {
    const base = cfg.scheduleMessage || 'Quero agendar minha avaliação e resgatar meu prêmio';
    const msg = encodeURIComponent(`${base} — Meu resultado: ${result?.title} • Prêmio: ${result?.prizeLabel} (quiz ${campaign.title})`);
    window.open(`https://wa.me/55${onlyDigits(campaign.whatsappNumber)}?text=${msg}`, '_blank');
  };

  // Gera (uma vez) a arte 1080x1920 e devolve o Blob.
  const getArtBlob = async (): Promise<Blob> => {
    return buildStoryArt({
      apiBase: API,
      logo: cfg.logo,
      name: form.name.trim(),
      resultTitle: result?.title || '',
      resultEmoji: result?.emoji,
      prizeLabel: result?.prizeLabel || '',
      clinicName: 'Clínica Caroline Maneira',
      handle: cfg.shareHashtag || '@carolinemaneira',
      primaryColor: color,
      secondaryColor: secondary,
      backgroundColor: background,
    });
  };

  const shareStory = async () => {
    setSharing(true);
    try {
      const blob = await getArtBlob();
      const file = new File([blob], 'meu-resultado.png', { type: 'image/png' });
      const caption = cfg.shareCaption || `Fiz o quiz da Clínica Caroline Maneira e meu resultado foi: ${result?.title}! 💆‍♀️✨`;
      const navAny = navigator as any;
      // Caminho ideal (mobile): folha de compartilhamento nativa → Instagram Stories
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({ files: [file], text: caption });
      } else {
        // Fallback (desktop / navegadores sem Web Share de arquivos): baixa a arte e abre o Instagram
        const url = URL.createObjectURL(blob);
        artUrlRef.current = url;
        const a = document.createElement('a');
        a.href = url; a.download = 'meu-resultado.png';
        document.body.appendChild(a); a.click(); a.remove();
        toast.success('Arte baixada! Abra o Instagram e poste nos Stories 💜');
        setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 600);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Não foi possível gerar a arte agora.');
    } finally {
      setSharing(false);
    }
  };

  const currentQ = questions[qIndex];

  return (
    <Box sx={{ minHeight: '100vh', background: bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <Box sx={{ maxWidth: 480, mx: 'auto', px: 3, py: { xs: 4, sm: 6 }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Cabeçalho */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
            <AutoAwesomeOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          {cfg.theme && (
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', mb: 0.5 }}>
              {cfg.theme}
            </Typography>
          )}
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem' }, lineHeight: 1.15 }}>
            {campaign.title}
          </Typography>
          {campaign.subtitle && (
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', mt: 1 }}>{campaign.subtitle}</Typography>
          )}
        </Box>

        {/* Barra de progresso (durante o quiz) */}
        {phase === 'quiz' && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${Math.round((qIndex / questions.length) * 100)}%`, backgroundColor: color, transition: 'width 0.3s ease', borderRadius: 3 }} />
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', mt: 0.75, textAlign: 'center' }}>
              Pergunta {qIndex + 1} de {questions.length}
            </Typography>
          </Box>
        )}

        {/* INTRO — coleta de dados */}
        {phase === 'intro' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>
              {cfg.introTitle || 'Responda e descubra seu resultado 🎁'}
            </Typography>
            {cfg.introSubtitle && (
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textAlign: 'center', mt: -1 }}>
                {cfg.introSubtitle}
              </Typography>
            )}
            <Field label="Seu nome" value={form.name} color={color} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Field label="WhatsApp" value={form.phone} color={color} mask onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            {cfg.askInstagram && (
              <Field label="@ do seu Instagram (opcional)" value={form.instagram} color={color} onChange={(v) => setForm((f) => ({ ...f, instagram: v }))} />
            )}
            <Button fullWidth variant="contained" size="large" onClick={startQuiz}
              sx={{ backgroundColor: ctaBg, color: ctaText, '&:hover': { backgroundColor: ctaBg, filter: 'brightness(0.92)' }, py: 1.6, fontSize: '1rem', fontWeight: 700, mt: 1 }}>
              Começar o quiz
            </Button>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textAlign: 'center' }}>
              Ao continuar você concorda em receber contato da clínica.
            </Typography>
          </Box>
        )}

        {/* QUIZ — perguntas */}
        {phase === 'quiz' && currentQ && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentQ.image && (
              <Box component="img" src={currentQ.image} alt="" sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: '12px' }} />
            )}
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', textAlign: 'center', mb: 1 }}>
              {currentQ.text}
            </Typography>
            {(currentQ.options || []).map((opt: any, i: number) => {
              const selected = answers[qIndex] === i;
              return (
                <Box key={i} onClick={() => !submitting && choose(i)}
                  sx={{
                    cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 2, py: 1.85, borderRadius: '14px',
                    backgroundColor: selected ? `${color}` : 'rgba(255,255,255,0.07)',
                    border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.18)'}`,
                    transition: 'all 0.15s ease',
                    '&:hover': { backgroundColor: selected ? color : 'rgba(255,255,255,0.13)', borderColor: color },
                  }}>
                  <Box sx={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.4)'}`, backgroundColor: selected ? 'rgba(255,255,255,0.25)' : 'transparent',
                  }}>
                    {selected && <CheckRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />}
                  </Box>
                  <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: selected ? 700 : 500 }}>{opt.label}</Typography>
                </Box>
              );
            })}
            {submitting && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <CircularProgress size={26} sx={{ color: '#fff' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', mt: 1 }}>Calculando seu resultado…</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* RESULTADO */}
        {phase === 'result' && result && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box sx={{ fontSize: '3.2rem', lineHeight: 1, mb: 1 }}>{result.emoji || '🎉'}</Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
              {cfg.successTitle || 'Seu resultado'}
            </Typography>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.7rem', mb: 1.5, lineHeight: 1.15 }}>
              {result.title}
            </Typography>
            {result.image && (
              <Box component="img" src={result.image} alt="" sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '14px', mb: 2 }} />
            )}
            {result.description && (
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem', mb: 2.5, maxWidth: 400, mx: 'auto' }}>
                {result.description}
              </Typography>
            )}

            {/* Prêmio */}
            <Box sx={{ display: 'inline-block', px: 3, py: 1.75, borderRadius: '14px', border: `2px dashed ${color}`, backgroundColor: 'rgba(255,255,255,0.06)', mb: 3 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                Você ganhou
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.35rem' }}>{result.prizeLabel}</Typography>
              {result.prizeDescription && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', mt: 0.5 }}>{result.prizeDescription}</Typography>
              )}
            </Box>

            {/* Compartilhar nos Stories */}
            <Button fullWidth variant="contained" size="large" startIcon={sharing ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <IosShareOutlinedIcon />} onClick={shareStory} disabled={sharing}
              sx={{ background: 'linear-gradient(95deg, #F58529, #DD2A7B 50%, #8134AF)', '&:hover': { filter: 'brightness(0.95)' }, py: 1.7, fontSize: '1rem', fontWeight: 800, mb: 1.5 }}>
              {sharing ? 'Gerando arte…' : 'Postar resultado nos Stories'}
            </Button>

            {/* Agendar / resgatar */}
            <Button fullWidth variant="contained" size="large" startIcon={<WhatsAppIcon />} onClick={scheduleWhatsApp}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ea952' }, py: 1.6, fontSize: '1rem', fontWeight: 800 }}>
              Agendar e resgatar meu prêmio
            </Button>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', mt: 2 }}>
              Apresente esta tela na clínica para validar seu prêmio.
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1 }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', textAlign: 'center', mt: 4 }}>
          Clínica Caroline Maneira · CRBM PR1168
        </Typography>
      </Box>
    </Box>
  );
}

/** Campo de texto com tema escuro e máscara opcional de telefone. */
function Field({ label, value, onChange, color, mask }: {
  label: string; value: string; onChange: (v: string) => void; color: string; mask?: boolean;
}) {
  return (
    <input
      placeholder={label}
      value={value}
      onChange={(e) => onChange(mask ? maskPhone(e.target.value) : e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Inter, sans-serif',
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = color)}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
    />
  );
}
