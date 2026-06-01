'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await api.get('/products');
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isLow = (p: any) => Number(p.quantity) <= Number(p.minQuantity);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500 text-sm">{products.filter(isLow).length} produto(s) com estoque baixo</p>
        </div>
        <Button className="bg-rose-500 hover:bg-rose-600" onClick={() => toast.info('Em breve!')}>
          <Plus className="w-4 h-4 mr-2" /> Novo produto
        </Button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <Card key={p.id} className={`border-rose-100 ${isLow(p) ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-400" />
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-500">{p.brand}</p>}
                    </div>
                  </div>
                  {isLow(p) && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{p.quantity} <span className="text-sm font-normal text-gray-500">{p.unit}</span></div>
                  <Badge variant="outline" className={isLow(p) ? 'border-amber-300 text-amber-600' : 'border-rose-200 text-rose-600'}>
                    mín: {p.minQuantity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
