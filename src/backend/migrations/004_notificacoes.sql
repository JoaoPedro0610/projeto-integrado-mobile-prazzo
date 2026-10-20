-- =============================================================
-- 004 - Notificacoes
--
-- O slogan do projeto e "notificacoes inteligentes", mas o mock nao modelava
-- nada disso. Cada linha aqui e um disparo agendado para uma tarefa - tipico
-- "24 horas antes" e "1 hora antes" do prazo.
-- =============================================================
CREATE TABLE notificacoes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id     uuid        NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  -- Redundante em relacao a tarefas.usuario_id, e de proposito: o worker
  -- precisa saber para quem enviar sem fazer JOIN, e a coluna sustenta o
  -- escopo por usuario direto no WHERE.
  usuario_id    uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  agendada_para timestamptz NOT NULL,
  -- NULL = ainda na fila. Preenchida no momento do envio.
  enviada_em    timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now(),

  -- Idempotencia. Reagendar as notificacoes depois de o usuario mudar o prazo
  -- da tarefa nao pode gerar duplicata, e o worker pode rodar duas vezes sem
  -- avisar o aluno duas vezes da mesma coisa.
  UNIQUE (tarefa_id, agendada_para)
);

-- Indice parcial: o worker so procura o que ainda nao foi enviado, e essa
-- fatia continua minuscula enquanto o historico de enviadas cresce sem parar.
--   WHERE enviada_em IS NULL AND agendada_para <= now()
CREATE INDEX notificacoes_pendentes ON notificacoes (agendada_para)
  WHERE enviada_em IS NULL;
