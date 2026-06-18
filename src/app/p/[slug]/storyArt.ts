// Geração da arte de Stories (1080x1920) no próprio navegador, via Canvas.
// Imagens externas (logo) são carregadas através do proxy do backend para evitar
// "tainted canvas" (que impediria exportar o PNG).

interface ArtParams {
  apiBase: string;
  logo?: string;
  name: string;
  resultTitle: string;
  resultEmoji?: string;
  prizeLabel: string;
  clinicName: string;
  handle: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Quebra um texto em linhas que caibam em maxWidth, respeitando a fonte já setada no contexto. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function buildStoryArt(p: ArtParams): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');

  // Fundo — gradiente diagonal usando as cores da campanha
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, p.primaryColor);
  grad.addColorStop(0.55, p.secondaryColor);
  grad.addColorStop(1, p.backgroundColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Brilhos decorativos
  const glow = (cx: number, cy: number, rad: number, alpha: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(W * 0.8, H * 0.12, 520, 0.18);
  glow(W * 0.15, H * 0.9, 600, 0.1);

  ctx.textAlign = 'center';

  // Logo da clínica (via proxy para não sujar o canvas)
  let topY = 300;
  if (p.logo) {
    try {
      const proxied = `${p.apiBase}/public/campaigns/asset?u=${encodeURIComponent(p.logo)}`;
      const img = await loadImage(proxied);
      const maxW = 360, maxH = 200;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const lw = img.width * ratio, lh = img.height * ratio;
      ctx.drawImage(img, (W - lw) / 2, 200, lw, lh);
      topY = 200 + lh + 80;
    } catch {
      topY = 320;
    }
  }

  // Etiqueta superior
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 34px Inter, Arial, sans-serif';
  ctx.fillText('EU FIZ O QUIZ E DESCOBRI', W / 2, topY);

  // Emoji do resultado
  let y = topY + 130;
  if (p.resultEmoji) {
    ctx.font = '120px Arial, sans-serif';
    ctx.fillText(p.resultEmoji, W / 2, y);
    y += 90;
  }

  // Título do resultado (com quebra de linha)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 88px Inter, Arial, sans-serif';
  const titleLines = wrapLines(ctx, p.resultTitle, W - 160);
  for (const line of titleLines) {
    y += 100;
    ctx.fillText(line, W / 2, y);
  }

  // Nome do lead
  if (p.name) {
    y += 90;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 40px Inter, Arial, sans-serif';
    ctx.fillText(p.name, W / 2, y);
  }

  // Caixa do prêmio (tracejada)
  y += 120;
  ctx.font = '700 52px Inter, Arial, sans-serif';
  const prizeLines = wrapLines(ctx, p.prizeLabel, W - 280);
  const boxPadV = 50, lineH = 64;
  const boxH = 120 + (prizeLines.length - 1) * lineH;
  const boxW = W - 200;
  const boxX = (W - boxW) / 2;
  const boxY = y;
  ctx.save();
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 36);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 30px Inter, Arial, sans-serif';
  ctx.fillText('GANHEI', W / 2, boxY + 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px Inter, Arial, sans-serif';
  let py = boxY + 52 + boxPadV;
  for (const line of prizeLines) {
    ctx.fillText(line, W / 2, py);
    py += lineH;
  }

  // Rodapé — nome e @ da clínica
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 44px Inter, Arial, sans-serif';
  ctx.fillText(p.clinicName, W / 2, H - 180);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 38px Inter, Arial, sans-serif';
  ctx.fillText(p.handle, W / 2, H - 120);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))), 'image/png', 0.95);
  });
}
