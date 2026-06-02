'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, MousePointer, ExternalLink, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignEditor } from './campaign-editor';

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    const res = await api.get('/campaigns');
    setCampaigns(res.data);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Remover campanha?')) return;
    await api.delete(`/campaigns/${id}`);
    toast.success('Campanha removida!');
    load();
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://maneira.tecworks.com.br/p/${slug}`);
    toast.success('Link copiado!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Campanhas</h1>
          <p className="text-gray-500 text-sm">Crie landing pages para captar leads</p>
        </div>
        <Button className="text-white" style={{ background: '#A0585A' }}
          onClick={() => { setSelected(null); setEditorOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova campanha
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#A0585A20' }}>
            <Plus className="w-7 h-7" style={{ color: '#A0585A' }} />
          </div>
          <p className="font-semibold text-gray-700">Nenhuma campanha ainda</p>
          <p className="text-sm text-gray-400 mt-1">Crie sua primeira landing page para captar leads</p>
          <Button className="mt-4 text-white" style={{ background: '#A0585A' }}
            onClick={() => { setSelected(null); setEditorOpen(true); }}>
            Criar primeira campanha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <Card key={c.id} className="border-0 shadow-sm overflow-hidden">
              {/* Preview color bar */}
              <div className="h-2" style={{ background: c.primaryColor || '#A0585A' }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <Badge variant="outline" className={`text-xs ${c.active ? 'border-green-200 text-green-600' : 'border-gray-200 text-gray-400'}`}>
                    {c.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                {c.subtitle && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.subtitle}</p>}

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{c.views} views</span>
                  <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{c.clicks} cliques</span>
                </div>

                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => copyLink(c.slug)}>
                    <Copy className="w-3 h-3 mr-1" /> Copiar link
                  </Button>
                  <a href={`/p/${c.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs px-2">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" className="text-xs px-2"
                    onClick={() => { setSelected(c); setEditorOpen(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs px-2 border-red-100 text-red-400 hover:bg-red-50"
                    onClick={() => remove(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampaignEditor open={editorOpen} onClose={() => { setEditorOpen(false); setSelected(null); load(); }} campaign={selected} />
    </div>
  );
}
