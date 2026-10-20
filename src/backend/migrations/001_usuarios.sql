-- =============================================================
-- 001 - Usuarios
--
-- O login do PRAZZO e por RA (as telas de Login e Register pedem RA, nao
-- e-mail), entao o RA e a chave natural: unico e obrigatorio.
-- =============================================================

-- Reaproveitada por todas as tabelas com `atualizado_em`. Ficar num TRIGGER, e
-- nao na aplicacao, garante que a coluna continue correta mesmo quando o
-- UPDATE vem de fora da API: psql, seed ou correcao manual.
CREATE OR REPLACE FUNCTION set_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE usuarios (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text        NOT NULL CHECK (length(trim(nome)) >= 3),
  -- Faixa de 6 a 8 digitos para bater EXATAMENTE com o que as telas produzem:
  -- RegisterScreen recusa menos de 6 (RA_MIN_LENGTH) e o Input corta em 8
  -- (maxLength), filtrando nao-digitos na digitacao. O CHECK repete a regra
  -- aqui porque validacao de tela e conveniencia, nao garantia de integridade.
  ra            varchar(8)  NOT NULL UNIQUE CHECK (ra ~ '^[0-9]{6,8}$'),
  email         text        NOT NULL CHECK (position('@' IN email) > 1),
  -- Nunca a senha em claro. Preenchida com bcrypt em usuarios.repository.
  senha_hash    text        NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Unicidade de e-mail sem diferenciar maiuscula/minuscula, e sem depender da
-- extensao citext: "Maria@x.com" e "maria@x.com" sao a mesma pessoa.
CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
