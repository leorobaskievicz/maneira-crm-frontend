'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  contraindications: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; onSave: (data: any) => void; patient?: any; }

export function PatientDialog({ open, onClose, onSave, patient }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (patient) reset({ ...patient, birthDate: patient.birthDate?.split('T')[0] });
    else reset({});
  }, [patient, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? 'Editar paciente' : 'Nova paciente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nome *</Label>
              <Input {...register('name')} placeholder="Nome completo" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input {...register('phone')} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Data de nascimento</Label>
              <Input {...register('birthDate')} type="date" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Email</Label>
              <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Endereço</Label>
              <Input {...register('address')} placeholder="Rua, número, bairro..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Alergias</Label>
              <Textarea {...register('allergies')} placeholder="Alergias conhecidas..." rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Contraindicações</Label>
              <Textarea {...register('contraindications')} placeholder="Contraindicações..." rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Observações</Label>
              <Textarea {...register('notes')} placeholder="Observações gerais..." rows={2} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
