// Formatadores de máscara (pt-BR). Cada função recebe o valor cru e devolve o texto formatado.
// O valor armazenado é o texto já mascarado (display-friendly); para uso técnico (ex.: link de
// WhatsApp) basta remover os não-dígitos com onlyDigits().

export function onlyDigits(v: string): string {
  return (v || '').replace(/\D/g, '');
}

/** Telefone/celular: (00) 0000-0000 ou (00) 00000-0000 */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CPF: 000.000.000-00 */
export function maskCPF(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** CNPJ: 00.000.000/0000-00 */
export function maskCNPJ(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

/** CEP: 00000-000 */
export function maskCEP(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

export const MASKS = {
  phone: maskPhone,
  cpf: maskCPF,
  cnpj: maskCNPJ,
  cep: maskCEP,
} as const;

export type MaskKind = keyof typeof MASKS;
