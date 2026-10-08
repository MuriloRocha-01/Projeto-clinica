BEGIN;
ALTER TABLE public.appointments ADD COLUMN reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN reminder_sent_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN reminder_attempts integer NOT NULL DEFAULT 0 CHECK (reminder_attempts>=0);
ALTER TABLE public.appointments ADD COLUMN reminder_claim_token text;
ALTER TABLE public.appointments ADD COLUMN reminder_claim_until timestamptz;
ALTER TABLE public.appointments ADD COLUMN reminder_next_attempt_at timestamptz;
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
 CHECK (status IN ('agendado','confirmado','chegou','em_atendimento','concluido','faltou','cancelado'));
CREATE INDEX appointments_reminder_idx ON public.appointments(start_time) WHERE NOT reminder_sent AND status='agendado';
ALTER TABLE public.appointments ADD COLUMN reminder_message_id text UNIQUE;
COMMIT;


