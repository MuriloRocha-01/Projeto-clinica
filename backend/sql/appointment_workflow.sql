-- Atualiza o schema anterior sem remover agendamentos.
BEGIN;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS check_in_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS called_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
UPDATE public.appointments SET status='agendado' WHERE status IN ('pendente','confirmado');
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'agendado';
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('agendado','na_recepcao','em_atendimento','concluido','faltou','cancelado'));
ALTER TABLE public.appointments ADD CONSTRAINT appointments_called_at_check
    CHECK (called_at IS NULL OR (check_in_at IS NOT NULL AND called_at >= check_in_at));
ALTER TABLE public.appointments ADD CONSTRAINT appointments_completed_at_check
    CHECK (completed_at IS NULL OR (called_at IS NOT NULL AND completed_at >= called_at));
CREATE INDEX appointments_queue_idx ON public.appointments(clinic_id,check_in_at,id) WHERE status='na_recepcao';
COMMIT;
