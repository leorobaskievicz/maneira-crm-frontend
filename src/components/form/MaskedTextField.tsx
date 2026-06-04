'use client';
import { TextField, type TextFieldProps } from '@mui/material';
import { MASKS, type MaskKind } from '@/lib/masks';

type MaskedTextFieldProps = Omit<TextFieldProps, 'onChange'> & {
  mask: MaskKind;
  onChange?: TextFieldProps['onChange'];
};

/**
 * TextField do MUI com máscara aplicada automaticamente.
 * Mantém o mesmo contrato de onChange (lê e.target.value já formatado),
 * então é drop-in nos formulários existentes.
 */
export function MaskedTextField({ mask, onChange, value, ...props }: MaskedTextFieldProps) {
  const format = MASKS[mask];
  // máscaras são idempotentes (removem não-dígitos antes de formatar),
  // então formatar o value também garante exibição correta de valores já salvos.
  const displayValue = value == null || value === '' ? value : format(String(value));
  return (
    <TextField
      {...props}
      value={displayValue}
      onChange={(e) => {
        e.target.value = format(e.target.value);
        onChange?.(e);
      }}
    />
  );
}
