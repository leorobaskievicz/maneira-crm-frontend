import api from './api';

/** Origem do backend (sem o sufixo /api) — usada para montar URLs de arquivos estáticos. */
export function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  return base.replace(/\/api\/?$/, '');
}

/** Envia uma imagem ao backend e devolve a URL absoluta pronta para uso. */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await api.post('/uploads', fd); // axios define o boundary multipart automaticamente
  // S3 devolve URL absoluta em `url`; fallback disco usa `path` relativo à origem da API.
  if (r.data.url && /^https?:\/\//.test(r.data.url)) return r.data.url;
  return apiOrigin() + (r.data.path || r.data.url);
}
