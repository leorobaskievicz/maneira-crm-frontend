'use client';
import { useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { toast } from 'sonner';
import { onlyDigits, maskPhone } from '@/lib/masks';
import { PrizeWheel } from '@/components/PrizeWheel';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function WheelLanding({ campaign, slug }: { campaign: any; slug: string }) {
  const cfg = campaign.wheelConfig || {};
  const slots = cfg.slots || [];
  const color = campaign.primaryColor || '#A0585A';
  const secondary = cfg.secondaryColor || '#1A1A1A';
  const background = cfg.backgroundColor || '#0d0d0d';
  const ctaBg = cfg.ctaBgColor || color;
  const ctaText = cfg.ctaTextColor || '#ffffff';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [prizeLabel, setPrizeLabel] = useState('');
  const [spinning, setSpinning] = useState(false);

  const goToWheel = () => {
    if (!form.name.trim()) return toast.error('Informe seu nome');
    if (onlyDigits(form.phone).length < 10) return toast.error('Informe um WhatsApp válido');
    setStep(2);
  };

  const spin = async () => {
    setSpinning(true);
    try {
      const r = await axios.post(`${API}/public/campaigns/${slug}/spin`, {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email,
      });
      setPrizeLabel(r.data.prizeLabel);
      setTargetIndex(r.data.prizeIndex);
    } catch {
      toast.error('Não foi possível girar agora. Tente novamente.');
      setSpinning(false);
    }
  };

  const scheduleWhatsApp = () => {
    const base = cfg.scheduleMessage || 'Quero agendar minha avaliação';
    const msg = encodeURIComponent(`${base} — Ganhei: ${prizeLabel} (campanha ${campaign.title})`);
    window.open(`https://wa.me/55${onlyDigits(campaign.whatsappNumber)}?text=${msg}`, '_blank');
  };

  const bg = cfg.backgroundImage
    ? `linear-gradient(180deg, ${background}CC, ${background}F2), url(${cfg.backgroundImage})`
    : `linear-gradient(165deg, ${color} 0%, ${secondary} 55%, ${background} 100%)`;

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

        {/* Indicador de passos */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
          {[1, 2, 3].map((s) => (
            <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700,
                backgroundColor: step >= s ? color : 'rgba(255,255,255,0.1)',
                color: step >= s ? '#fff' : 'rgba(255,255,255,0.4)',
                border: step === s ? '2px solid #fff' : '2px solid transparent',
              }}>{s}</Box>
              {s < 3 && <Box sx={{ width: 28, height: 2, backgroundColor: step > s ? color : 'rgba(255,255,255,0.1)' }} />}
            </Box>
          ))}
        </Box>

        {/* Passo 1 — Dados */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', textAlign: 'center' }}>
              Preencha para girar a roleta 🎁
            </Typography>
            <TextFieldMask label="Seu nome" value={form.name} color={color} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <TextFieldMask label="WhatsApp" value={form.phone} color={color} mask onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <TextFieldMask label="Email (opcional)" type="email" value={form.email} color={color} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Button fullWidth variant="contained" size="large" onClick={goToWheel}
              sx={{ backgroundColor: ctaBg, color: ctaText, '&:hover': { backgroundColor: ctaBg, filter: 'brightness(0.92)' }, py: 1.6, fontSize: '1rem', fontWeight: 700, mt: 1 }}>
              Continuar
            </Button>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textAlign: 'center' }}>
              Ao continuar você concorda em receber contato da clínica.
            </Typography>
          </Box>
        )}

        {/* Passo 2 — Girar */}
        {step === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <PrizeWheel slots={slots} targetIndex={targetIndex} spinDurationMs={cfg.spinDurationMs || 5000} onSpinEnd={() => setStep(3)} />
            <Button fullWidth variant="contained" size="large" onClick={spin} disabled={spinning}
              sx={{ backgroundColor: ctaBg, color: ctaText, '&:hover': { backgroundColor: ctaBg, filter: 'brightness(0.92)' }, py: 1.6, fontSize: '1.05rem', fontWeight: 800, mt: 3 }}>
              {spinning ? 'Girando…' : '🎯 GIRAR A ROLETA'}
            </Button>
          </Box>
        )}

        {/* Passo 3 — Resultado */}
        {step === 3 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CelebrationOutlinedIcon sx={{ fontSize: 64, color, mb: 1 }} />
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', mb: 1 }}>
              {cfg.successTitle || 'Parabéns! 🎉'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              {cfg.successMessage || 'Você ganhou:'}
            </Typography>
            <Box sx={{ display: 'inline-block', px: 3, py: 1.5, borderRadius: '12px', border: `2px dashed ${color}`, backgroundColor: 'rgba(255,255,255,0.06)', mb: 3 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem' }}>{prizeLabel}</Typography>
            </Box>
            <Button fullWidth variant="contained" size="large" startIcon={<WhatsAppIcon />} onClick={scheduleWhatsApp}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ea952' }, py: 1.7, fontSize: '1rem', fontWeight: 800 }}>
              Agendar minha avaliação e resgatar
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

/** TextField com tema escuro e máscara opcional de telefone, sem depender do MUI label flutuante. */
function TextFieldMask({ label, value, onChange, color, mask, type }: {
  label: string; value: string; onChange: (v: string) => void; color: string; mask?: boolean; type?: string;
}) {
  return (
    <Box>
      <input
        placeholder={label}
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(mask ? maskPhone(e.target.value) : e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 8,
          backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Inter, sans-serif',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = color)}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
      />
    </Box>
  );
}
