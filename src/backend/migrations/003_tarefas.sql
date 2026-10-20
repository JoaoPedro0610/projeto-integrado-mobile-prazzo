-- =============================================================
-- 003 - Tarefas (os "Prazzos")
--
-- Duas mudancas em relacao ao mock de app/src/data/agenda.ts:
--
--   1. `time: string` ("Ate 23:59", "As 19:00") vira `prazo timestamptz`.
--      O texto era apresentacao, nao dado: sem um instante de verdade nao ha
--      ordenacao, nao ha "tarefas da semana" e nao ha como disparar
--      notificacao "X horas antes do prazo".
--
--   2. `tag: string` acumulava tres conceitos - categoria ("Leitura", "Prova"),
--      estado ("Concluido") e prioridade ("Urgente"). Aqui viram tres colunas.
--      A etiqueta do card volta a ser montada na exibicao: se o status for
--      'concluida' mostra "Concluido", senao mostra o rotulo do tipo.
-- =============================================================
CREATE TYPE tarefa_tipo       AS ENUM ('prova', 'trabalho', 'leitura', 'entrega', 'outro');
CREATE TYPE tarefa_prioridade AS ENUM ('urgente', 'normal');
CREATE TYPE tarefa_status     AS ENUM ('pendente', 'concluida', 'cancelada');

CREATE TABLE tarefas (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid              NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  -- Anulavel e ON DELETE SET NULL de proposito: apagar a disciplina no fim do
  -- semestre nao pode levar embora o historico de tarefas dela.
  disciplina_id uuid              REFERENCES disciplinas(id) ON DELETE SET NULL,
  titulo        text              NOT NULL CHECK (length(trim(titulo)) > 0),
  descricao     text,
  tipo          tarefa_tipo       NOT NULL DEFAULT 'outro',
  prioridade    tarefa_prioridade NOT NULL DEFAULT 'normal',
  status        tarefa_status     NOT NULL DEFAULT 'pendente',
  prazo         timestamptz       NOT NULL,
  concluida_em  timestamptz,
  criado_em     timestamptz       NOT NULL DEFAULT now(),
  atualizado_em timestamptz       NOT NULL DEFAULT now(),

  -- Fecha os dois estados impossiveis de uma vez: concluida sem data de
  -- conclusao, e data de conclusao preenchida numa tarefa que nao esta
  -- concluida. Um bug no controller nao consegue gravar essa inconsistencia.
  CONSTRAINT tarefa_conclusao_coerente
    CHECK ((status = 'concluida') = (concluida_em IS NOT NULL))
);

-- A consulta da agenda semanal, que e a unica query quente do app:
--   WHERE usuario_id = $1 AND prazo >= $2 AND prazo < $3 ORDER BY prazo
-- O indice composto atende o filtro e a ordenacao no mesmo acesso.
CREATE INDEX tarefas_agenda ON tarefas (usuario_id, prazo);

-- O Postgres nao cria indice automatico para chave estrangeira. Sem este, um
-- DELETE em disciplinas varre tarefas inteira para aplicar o SET NULL.
CREATE INDEX tarefas_disciplina ON tarefas (disciplina_id);

CREATE TRIGGER trg_tarefas_atualizado_em
  BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
