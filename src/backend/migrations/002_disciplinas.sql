-- =============================================================
-- 002 - Disciplinas
--
-- "Entrega de BD II", "Prova P1 de Algoritmos", "Apresentacao de Redes": as
-- tarefas de exemplo do app sempre citam uma materia. Separar em tabela evita
-- repetir o nome (e as variacoes de digitacao) em cada tarefa, e da um lugar
-- para a cor da etiqueta do card.
-- =============================================================
CREATE TABLE disciplinas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome          text        NOT NULL CHECK (length(trim(nome)) > 0),
  codigo        text,
  -- Formato #rrggbb, o mesmo de app/src/theme/colors.ts.
  cor           char(7)     CHECK (cor ~ '^#[0-9a-fA-F]{6}$'),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  -- Cadastrar "BD II" duas vezes para o mesmo aluno e erro de digitacao, nao
  -- informacao nova. Escopado por usuario: dois alunos podem ter a mesma
  -- materia sem conflito.
  UNIQUE (usuario_id, nome)
);

CREATE TRIGGER trg_disciplinas_atualizado_em
  BEFORE UPDATE ON disciplinas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
