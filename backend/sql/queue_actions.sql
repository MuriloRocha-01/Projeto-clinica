BEGIN;
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
UPDATE public.appointments SET status='chegou' WHERE status='na_recepcao';
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
 CHECK (status IN ('agendado','chegou','em_atendimento','concluido','faltou','cancelado'));
ALTER TABLE public.appointments ADD COLUMN priority integer NOT NULL DEFAULT 0
 CHECK (priority BETWEEN 0 AND 100);
DROP INDEX public.appointments_queue_idx;
CREATE INDEX appointments_queue_idx ON public.appointments(clinic_id,priority DESC,check_in_at,id) WHERE status='chegou';
COMMIT;
