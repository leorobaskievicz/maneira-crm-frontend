'use client';
import { useEffect, useRef, useState } from 'react';

export interface WheelSlot {
  label: string;
  color: string;
  weight?: number;
}

interface PrizeWheelProps {
  slots: WheelSlot[];
  /** Índice sorteado pelo servidor. Quando muda de null para um número, a roda gira até ele. */
  targetIndex: number | null;
  spinDurationMs?: number;
  onSpinEnd?: () => void;
  size?: number;
}

const C = 110;        // centro do viewBox (220x220)
const R = 100;        // raio da roda
const LABEL_R = 64;   // raio onde o texto é posicionado
const SPINS = 6;      // voltas completas antes de parar

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
}

function slicePath(startDeg: number, endDeg: number) {
  const a = polar(startDeg, R);
  const b = polar(endDeg, R);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${C} ${C} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

function wrapLabel(label: string, maxCharsPerLine: number): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const chunks: string[] = [];
    for (let start = 0; start < word.length; start += maxCharsPerLine) {
      chunks.push(word.slice(start, start + maxCharsPerLine));
    }

    chunks.forEach((chunk, chunkIndex) => {
      const candidate = currentLine ? `${currentLine} ${chunk}` : chunk;

      if (currentLine && candidate.length > maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = chunk;
      } else {
        currentLine = candidate;
      }

      // Palavras muito longas também são quebradas, sem voltar ao reticências.
      if (chunkIndex < chunks.length - 1) {
        lines.push(currentLine);
        currentLine = '';
      }
    });
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function textColorFor(bg: string): string {
  const h = bg.replace('#', '');
  if (h.length < 6) return '#fff';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  // luminância relativa simples
  return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#1A1A1A' : '#ffffff';
}

export function PrizeWheel({ slots, targetIndex, spinDurationMs = 5000, onSpinEnd, size = 320 }: PrizeWheelProps) {
  const [rotation, setRotation] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = slots.length || 1;
  const seg = 360 / n;

  useEffect(() => {
    if (targetIndex == null) return;
    const centerAngle = targetIndex * seg + seg / 2;
    // gira SPINS voltas e para com o centro do prêmio sob o ponteiro (topo)
    setRotation(360 * SPINS + (360 - centerAngle));
    timer.current = setTimeout(() => onSpinEnd?.(), spinDurationMs);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIndex]);

  return (
    <div style={{ width: size, height: size, position: 'relative', margin: '0 auto' }}>
      {/* Ponteiro */}
      <div style={{
        position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
        borderTop: '22px solid #fff', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
      }} />

      <svg viewBox="0 0 220 220" width={size} height={size} style={{ display: 'block' }}>
        {/* Aro externo */}
        <circle cx={C} cy={C} r={R + 6} fill="#1A1A1A" />
        <circle cx={C} cy={C} r={R + 6} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '110px 110px',
            transition: targetIndex == null ? 'none' : `transform ${spinDurationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`,
          }}
        >
          {slots.map((slot, i) => {
            const start = i * seg;
            const end = (i + 1) * seg;
            const mid = start + seg / 2;
            const lp = polar(mid, LABEL_R);
            const labelFontSize = Math.max(6.5, Math.min(8.5, 10 - n * 0.375));
            const halfSegment = Math.min(Math.PI / 2 - 0.01, (seg * Math.PI / 180) / 2);
            const availableWidth = Math.min(2 * LABEL_R, 2 * LABEL_R * Math.tan(halfSegment)) * 0.72;
            const maxCharsPerLine = Math.max(4, Math.floor(availableWidth / (labelFontSize * 0.57)));
            const lines = wrapLabel(slot.label || '', maxCharsPerLine);
            const lineHeight = labelFontSize * 1.15;
            const firstLineDy = -((lines.length - 1) * lineHeight) / 2;
            // Evita que os textos das fatias inferiores fiquem de cabeça para baixo.
            const labelRotation = mid > 90 && mid < 270 ? mid + 180 : mid;
            return (
              <g key={i}>
                <path d={slicePath(start, end)} fill={slot.color || '#A0585A'} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                <text
                  x={lp.x} y={lp.y}
                  transform={`rotate(${labelRotation} ${lp.x} ${lp.y})`}
                  fill={textColorFor(slot.color || '#A0585A')}
                  fontSize={labelFontSize} fontWeight="700" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}
                >
                  {lines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={lp.x} dy={lineIndex === 0 ? firstLineDy : lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>

        {/* Centro */}
        <circle cx={C} cy={C} r="16" fill="#fff" stroke="#1A1A1A" strokeWidth="2" />
        <circle cx={C} cy={C} r="6" fill="#A0585A" />
      </svg>
    </div>
  );
}
