-- Schema da API para PostgreSQL/Supabase.
-- Aplicar em um banco novo: CREATE TABLE não modifica tabelas já existentes.
-- Dias da semana: 0 = domingo, 1 = segunda, ..., 6 = sábado.
BEGIN;

CREATE TABLE public.clinics (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
    -- Sem pontuação. Validação dos dígitos verificadores fica na API.
    cnpj varchar(14) NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9]{14}$'),
    address text NOT NULL CHECK (length(trim(address)) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.professionals (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id bigint NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
    specialty varchar(120) NOT NULL CHECK (length(trim(specialty)) > 0),
    -- Exemplo: [{"weekday":1,"start":"08:00","end":"12:00"}]
    -- A API valida dias, horários e sobreposição dos intervalos.
    availability jsonb NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(availability) = 'array'),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX professionals_clinic_id_idx ON public.professionals(clinic_id);
ALTER TABLE public.professionals ADD CONSTRAINT professionals_clinic_id_id_key UNIQUE (clinic_id, id);

CREATE TABLE public.clients (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id bigint NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
    phone varchar(30) NOT NULL CHECK (length(trim(phone)) > 0),
    email varchar(254) NOT NULL CHECK (email = lower(trim(email)) AND length(email) > 0),
    birth_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, email)
);
-- O índice UNIQUE acima também atende buscas por clinic_id.
ALTER TABLE public.clients ADD CONSTRAINT clients_clinic_id_id_key UNIQUE (clinic_id, id);

CREATE TABLE public.appointments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id bigint NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    professional_id bigint NOT NULL,
    client_id bigint NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'agendado'
        CHECK (status IN ('agendado', 'confirmado', 'chegou', 'em_atendimento', 'concluido', 'faltou', 'cancelado')),
    notes text,
    priority integer NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
    reminder_sent boolean NOT NULL DEFAULT false,
    reminder_sent_at timestamptz,
    reminder_message_id text UNIQUE,
    reminder_attempts integer NOT NULL DEFAULT 0 CHECK (reminder_attempts>=0),
    reminder_claim_token text,
    reminder_claim_until timestamptz,
    reminder_next_attempt_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    check_in_at timestamptz,
    called_at timestamptz,
    completed_at timestamptz,
    CHECK (called_at IS NULL OR (check_in_at IS NOT NULL AND called_at >= check_in_at)),
    CHECK (completed_at IS NULL OR (called_at IS NOT NULL AND completed_at >= called_at)),
    CHECK (end_time > start_time),
    FOREIGN KEY (clinic_id, professional_id)
        REFERENCES public.professionals(clinic_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (clinic_id, client_id)
        REFERENCES public.clients(clinic_id, id) ON DELETE RESTRICT
);
CREATE INDEX appointments_clinic_start_idx ON public.appointments(clinic_id, start_time);
CREATE INDEX appointments_professional_start_idx ON public.appointments(clinic_id, professional_id, start_time);
CREATE INDEX appointments_client_start_idx ON public.appointments(clinic_id, client_id, start_time);
CREATE INDEX appointments_queue_idx ON public.appointments(clinic_id, priority DESC, check_in_at, id) WHERE status='chegou';
CREATE INDEX appointments_reminder_idx ON public.appointments(start_time) WHERE NOT reminder_sent AND status='agendado';

-- A API Go acessa via PostgreSQL. Não liberar dados de pacientes pela Data API.
-- Sem policies: anon/authenticated não podem acessar linhas.
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

COMMIT;


