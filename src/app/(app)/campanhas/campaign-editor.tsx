'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const PROCEDURES = [
  'Toxina Botulínica','Preenchimento Facial','Limpeza de Pele','Skinbooster',
  'Bioestimulador de Colágeno','Microagulhamento','HIFU Facial','Fios de Sustentação',
  'Radiofrequência','PEIM','HIFU Corporal','Corrente Russa','Depilação a Laser','Ledterapia','Intradermoterapia',
];

const emptyForm = {
  title: '', subtitle: '', ctaType: 'whatsapp', ctaText: 'Agendar pelo WhatsApp',
  whatsappNumber: '41984443694', primaryColor: '#A0585A', procedures: [] as string[], active: true,
};

interface Props { open: boolean; onClose: () => void; campaign?: any; }

export function CampaignEditor({ open, onClose, campaign }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [procInput, setProcInput] = useState('');

  useEffect(() => {
    if (campaign) {
      setForm({
        title: campaign.title, subtitle: campaign.subtitle || '',
        ctaType: campaign.ctaType, ctaText: campaign.ctaText || 'Agendar pelo WhatsApp',
        whatsappNumber: campaign.whatsappNumber || '41984443694',
        primaryColor: campaign.primaryColor || '#A0585A',
        procedures: campaign.procedures || [], active: campaign.active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [campaign, open]);

  const addProcedure = (p: string) => {
    if (p && !form.procedures.includes(p)) {
      setForm(f => ({ ...f, procedures: [...f.procedures, p] }));
    }
    setProcInput('');
  };

  const removeProcedure = (p: string) => {
    setForm(f => ({ ...f, procedures: f.procedures.filter(x => x !== p) }));
  };

  const save = async () => {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    try {
      if (campaign) await api.put(`/campaigns/${campaign.id}`, form);
      else await api.post('/campaigns', form);
      toast.success(campaign ? 'Campanha atualizada!' : 'Campanha criada!');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao salvar'); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide text-sm font-bold">
            {campaign ? 'Editar Campanha' : 'Nova Campanha'} — Landing Page
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Título da página *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Botox com desconto especial" />
            </div>
            <div className="space-y-1">
              <Label>Subtítulo</Label>
              <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Ex: Agende agora e ganhe avaliação gratuita" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Procedimentos em destaque</Label>
              <Select value={procInput} onValueChange={v => { addProcedure(v); }}>
                <SelectTrigger><SelectValue placeholder="Adicionar procedimento" /></SelectTrigger>
                <SelectContent>
                  {PROCEDURES.filter(p => !form.procedures.includes(p)).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.procedures.map(p => (
                  <Badge key={p} variant="outline" className="text-xs gap-1">
                    {p}
                    <button onClick={() => removeProcedure(p)}><X className="w-2.5 h-2.5" /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de CTA</Label>
                <Select value={form.ctaType} onValueChange={v => setForm(f => ({ ...f, ctaType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">Botão WhatsApp</SelectItem>
                    <SelectItem value="form">Formulário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cor principal</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-9 h-9 rounded cursor-pointer border border-gray-200" />
                  <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="text-xs" />
                </div>
              </div>
            </div>
            {form.ctaType === 'whatsapp' && (
              <div className="space-y-1">
                <Label>Número WhatsApp (somente dígitos)</Label>
                <Input value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="41984443694" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Texto do botão CTA</Label>
              <Input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</p>
            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ background: '#111' }}>
              {/* Header */}
              <div className="p-4 text-center" style={{ background: form.primaryColor }}>
                <p className="text-white text-xs uppercase tracking-widest opacity-70">Clínica Caroline Maneira</p>
                <h3 className="text-white font-bold text-base mt-1 leading-tight">
                  {form.title || 'Título da campanha'}
                </h3>
                {form.subtitle && <p className="text-white/80 text-xs mt-1">{form.subtitle}</p>}
              </div>
              {/* Body */}
              <div className="p-4 space-y-2">
                {form.procedures.length > 0 && (
                  <div className="space-y-1">
                    {form.procedures.slice(0,3).map(p => (
                      <div key={p} className="flex items-center gap-2 text-xs text-white/80">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: form.primaryColor }} />
                        {p}
                      </div>
                    ))}
                    {form.procedures.length > 3 && <p className="text-xs text-white/40">+{form.procedures.length - 3} mais</p>}
                  </div>
                )}
                <button className="w-full py-2.5 rounded-lg text-white text-xs font-bold uppercase tracking-wider mt-2"
                  style={{ background: form.ctaType === 'whatsapp' ? '#25D366' : form.primaryColor }}>
                  {form.ctaType === 'whatsapp' ? '💬 ' : ''}{form.ctaText}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="text-white" style={{ background: '#A0585A' }}>
            {campaign ? 'Salvar alterações' : 'Criar campanha'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
