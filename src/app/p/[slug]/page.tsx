'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, Phone, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LandingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', procedureInterest: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API}/public/campaigns/${slug}`)
      .then(r => setCampaign(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleWhatsApp = async () => {
    await axios.post(`${API}/public/campaigns/${slug}/click`).catch(() => {});
    const msg = encodeURIComponent(`Olá! Vi a campanha "${campaign.title}" e gostaria de saber mais sobre ${formData.procedureInterest || campaign.procedures?.[0] || 'os procedimentos'}.`);
    window.open(`https://wa.me/55${campaign.whatsappNumber}?text=${msg}`, '_blank');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { toast.error('Preencha nome e telefone'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        name: formData.name, phone: formData.phone,
        procedureInterest: formData.procedureInterest || campaign.procedures?.[0] || '',
        source: 'google', notes: `Campanha: ${campaign.title}`,
      });
      await axios.post(`${API}/public/campaigns/${slug}/click`).catch(() => {});
      setSubmitted(true);
    } catch { toast.error('Erro ao enviar. Tente pelo WhatsApp.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111' }}>
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111' }}>
      <div className="text-center text-white">
        <p className="text-2xl font-bold">Página não encontrada</p>
        <p className="text-white/50 mt-2">Esta campanha não existe ou foi desativada.</p>
      </div>
    </div>
  );

  const color = campaign.primaryColor || '#A0585A';

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f' }}>
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 text-center" style={{ background: `linear-gradient(135deg, ${color}ee, ${color}88)` }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-white/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Clínica Caroline Maneira</p>
        <h1 className="text-white text-3xl font-bold leading-tight mb-3">{campaign.title}</h1>
        {campaign.subtitle && <p className="text-white/80 text-base">{campaign.subtitle}</p>}
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Procedimentos */}
        {campaign.procedures?.length > 0 && (
          <div className="space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-wider">Procedimentos</p>
            {campaign.procedures.map((p: string) => (
              <div key={p} className="flex items-center gap-3 py-2.5 px-4 rounded-xl" style={{ background: '#1a1a1a' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-white text-sm">{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="w-14 h-14 mx-auto" style={{ color }} />
            <h2 className="text-white text-xl font-bold">Recebemos seu contato!</h2>
            <p className="text-white/60 text-sm">Em breve a Dra. Caroline entrará em contato.</p>
            <Button onClick={handleWhatsApp} className="w-full text-white font-bold py-3" style={{ background: '#25D366' }}>
              💬 Falar pelo WhatsApp agora
            </Button>
          </div>
        ) : campaign.ctaType === 'whatsapp' ? (
          <div className="space-y-3">
            <Input placeholder="Seu nome" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12" />
            <Input placeholder="Seu telefone" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12" />
            <Button onClick={handleWhatsApp} className="w-full text-white font-bold py-6 text-base"
              style={{ background: '#25D366' }}>
              💬 {campaign.ctaText || 'Agendar pelo WhatsApp'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <Input placeholder="Seu nome *" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12" />
            <Input placeholder="Seu telefone *" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12" />
            <Input placeholder="Qual procedimento te interessa?" value={formData.procedureInterest}
              onChange={e => setFormData(f => ({ ...f, procedureInterest: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12" />
            <Button type="submit" disabled={submitting} className="w-full text-white font-bold py-6 text-base" style={{ background: color }}>
              {submitting ? 'Enviando...' : campaign.ctaText || 'Quero agendar!'}
            </Button>
          </form>
        )}

        {/* Info clínica */}
        <div className="pt-4 border-t border-white/10 space-y-2 text-white/40 text-xs">
          <div className="flex items-center gap-2"><Phone className="w-3 h-3" />(41) 98444-3694</div>
          <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />Rua Amaro de Santa Rita, 357, Sala 2 — Curitiba/PR</div>
          <div className="flex items-center gap-2"><Clock className="w-3 h-3" />Segunda a Sábado, 9h às 18h</div>
        </div>

        <p className="text-center text-white/20 text-xs pb-4">
          CRBM PR1168 · Biomedicina Estética
        </p>
      </div>
    </div>
  );
}
