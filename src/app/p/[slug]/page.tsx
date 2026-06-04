'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Box, Typography, TextField, Button, CircularProgress, Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { toast } from 'sonner';
import { onlyDigits } from '@/lib/masks';
import { WheelLanding } from './WheelLanding';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LandingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', procedureInterest: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API}/public/campaigns/${slug}`).then(r => setCampaign(r.data)).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [slug]);

  const trackClick = () => axios.post(`${API}/public/campaigns/${slug}/click`).catch(() => {});

  const handleWhatsApp = async () => {
    await trackClick();
    const msg = encodeURIComponent(`Olá! Vi a campanha "${campaign.title}" e gostaria de saber mais sobre ${form.procedureInterest || campaign.procedures?.[0] || 'os procedimentos'}.${form.name ? ` Meu nome é ${form.name}.` : ''}`);
    window.open(`https://wa.me/55${onlyDigits(campaign.whatsappNumber)}?text=${msg}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Preencha nome e telefone'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, { name: form.name, phone: form.phone, procedureInterest: form.procedureInterest || campaign.procedures?.[0] || '', source: 'google', notes: `Campanha: ${campaign.title}` });
      await trackClick();
      setSubmitted(true);
    } catch { toast.error('Erro ao enviar. Tente pelo WhatsApp.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f' }}>
      <CircularProgress sx={{ color: '#A0585A' }} />
    </Box>
  );

  if (notFound) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f', textAlign: 'center' }}>
      <Box>
        <Typography sx={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>Página não encontrada</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', mt: 1 }}>Esta campanha não existe ou foi desativada.</Typography>
      </Box>
    </Box>
  );

  // Roleta de Prêmios — fluxo de 3 passos
  if (campaign.campaignType === 'wheel') {
    return <WheelLanding campaign={campaign} slug={slug} />;
  }

  const color = campaign.primaryColor || '#A0585A';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      {/* Hero */}
      <Box sx={{ px: 3, pt: 6, pb: 5, textAlign: 'center', background: `linear-gradient(160deg, ${color}DD, ${color}77)` }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <AutoAwesomeOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 1 }}>
          Clínica Caroline Maneira
        </Typography>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.2rem' }, lineHeight: 1.2, mb: 1.5 }}>
          {campaign.title}
        </Typography>
        {campaign.subtitle && (
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 460, mx: 'auto' }}>
            {campaign.subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ maxWidth: 480, mx: 'auto', px: 3, py: 4 }}>
        {/* Procedimentos */}
        {campaign.procedures?.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
              Procedimentos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {campaign.procedures.map((p: string) => (
                <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 2, borderRadius: '4px', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>{p}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* CTA */}
        {submitted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 52, color, mb: 2 }} />
            <Typography sx={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, mb: 1 }}>Recebemos seu contato!</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>A Dra. Caroline entrará em contato em breve.</Typography>
            <Button fullWidth variant="contained" size="large" startIcon={<WhatsAppIcon />} onClick={handleWhatsApp}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ea952' }, py: 1.5, fontSize: '1rem', fontWeight: 700 }}>
              Falar pelo WhatsApp agora
            </Button>
          </Box>
        ) : campaign.ctaType === 'whatsapp' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField placeholder="Seu nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#1a1a1a', '& fieldset': { borderColor: '#2a2a2a' }, '&:hover fieldset': { borderColor: color }, input: { color: '#fff' } } }} />
            <TextField placeholder="Seu telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              fullWidth sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#1a1a1a', '& fieldset': { borderColor: '#2a2a2a' }, '&:hover fieldset': { borderColor: color }, input: { color: '#fff' } } }} />
            <Button fullWidth variant="contained" size="large" startIcon={<WhatsAppIcon />} onClick={handleWhatsApp}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ea952' }, py: 1.75, fontSize: '1rem', fontWeight: 700, mt: 0.5 }}>
              {campaign.ctaText || 'Agendar pelo WhatsApp'}
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['Seu nome', 'Seu telefone', 'Procedimento de interesse'].map((placeholder, i) => (
                <TextField key={i} placeholder={placeholder}
                  value={[form.name, form.phone, form.procedureInterest][i]}
                  onChange={e => setForm(f => ({ ...f, [['name','phone','procedureInterest'][i]]: e.target.value }))}
                  fullWidth sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#1a1a1a', '& fieldset': { borderColor: '#2a2a2a' }, '&:hover fieldset': { borderColor: color }, input: { color: '#fff' } } }} />
              ))}
              <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}
                sx={{ backgroundColor: color, '&:hover': { filter: 'brightness(0.9)' }, py: 1.75, fontSize: '1rem', fontWeight: 700, mt: 0.5 }}>
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (campaign.ctaText || 'Quero agendar!')}
              </Button>
            </Box>
          </form>
        )}

        {/* Info clínica */}
        <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #1f1f1f' }}>
          {[
            { icon: <PhoneOutlinedIcon sx={{ fontSize: 14 }} />, text: '(41) 98444-3694' },
            { icon: <LocationOnOutlinedIcon sx={{ fontSize: 14 }} />, text: 'Rua Amaro de Santa Rita, 357, Sala 2 — Curitiba/PR' },
            { icon: <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />, text: 'Segunda a Sábado, 9h às 18h' },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, color: 'rgba(255,255,255,0.3)' }}>
              {item.icon}
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{item.text}</Typography>
            </Box>
          ))}
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', mt: 2, textAlign: 'center' }}>
            CRBM PR1168 · Biomedicina Estética
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
