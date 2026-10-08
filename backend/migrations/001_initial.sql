BEGIN;
CREATE TABLE IF NOT EXISTS professionals (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
    email varchar(254) NOT NULL UNIQUE CHECK (email = lower(email)),
    specialty varchar(120) NOT NULL CHECK (length(trim(specialty)) > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clients (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
    email varchar(254) NOT NULL UNIQUE CHECK (email = lower(email)),
    phone varchar(30) NOT NULL CHECK (length(trim(phone)) > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
