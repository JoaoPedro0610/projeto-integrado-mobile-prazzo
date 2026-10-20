# PRAZZO — Documentação do Banco de Dados

> Gestão de tarefas acadêmicas com notificações inteligentes.
> **"Organize. Planeje. Cumpra."**

| Item              | Valor                                              |
| ----------------- | -------------------------------------------------- |
| SGBD              | PostgreSQL 17 (imagem `postgres:17-alpine`)        |
| Nome do banco     | `prazzo`                                           |
| Usuário / senha   | `prazzo` / `prazzo` (apenas desenvolvimento)       |
| Porta             | `5432`                                             |
| Fuso horário      | `America/Sao_Paulo`                                |
| String de conexão | `postgresql://prazzo:prazzo@localhost:5432/prazzo` |
| Fonte da verdade  | `src/backend/migrations/*.sql`                  |

---

## Sumário

1. [Elaborar modelo de dados](#1-elaborar-modelo-de-dados)
   1. [Levantamento de requisitos](#11-levantamento-de-requisitos)
   2. [Modelo conceitual (entidades e relacionamentos)](#12-modelo-conceitual)
   3. [Diagrama Entidade-Relacionamento](#13-diagrama-entidade-relacionamento)
   4. [Modelo lógico — dicionário de dados](#14-modelo-lógico--dicionário-de-dados)
   5. [Tipos enumerados](#15-tipos-enumerados)
   6. [Regras de integridade](#16-regras-de-integridade)
   7. [Índices](#17-índices)
   8. [Decisões de modelagem](#18-decisões-de-modelagem)
2. [Criar o database](#2-criar-o-database)
   1. [Pré-requisitos](#21-pré-requisitos)
   2. [Subir o servidor PostgreSQL](#22-subir-o-servidor-postgresql)
   3. [Aplicar as migrations](#23-aplicar-as-migrations)
   4. [Popular com dados de exemplo](#24-popular-com-dados-de-exemplo)
   5. [Script SQL completo (DDL)](#25-script-sql-completo-ddl)
   6. [Verificação](#26-verificação)
   7. [Comandos úteis](#27-comandos-úteis)

---

## 1. Elaborar modelo de dados

### 1.1 Levantamento de requisitos

Requisitos extraídos das telas do app (Welcome, Login, Register, Dashboard) e do protótipo `index.html`:

| #    | Requisito                                                                                   | Impacto no modelo                                   |
| ---- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| RF01 | O aluno se cadastra com nome, RA, e-mail e senha.                                           | Entidade **Usuário**                                |
| RF02 | O login é feito por **RA** + senha.                                                         | RA único e obrigatório (chave natural)              |
| RF03 | O RA tem de 6 a 8 dígitos numéricos.                                                        | `CHECK` com expressão regular                       |
| RF04 | Não pode haver dois cadastros com o mesmo e-mail (sem diferenciar maiúsculas).              | Índice único sobre `lower(email)`                   |
| RF05 | Cada tarefa pertence a uma matéria ("Entrega de BD II", "Prova P1 de Algoritmos").          | Entidade **Disciplina**, com cor para a etiqueta    |
| RF06 | O aluno cadastra tarefas (os "Prazzos") com título, tipo, prioridade e prazo.               | Entidade **Tarefa**                                 |
| RF07 | O Dashboard mostra a agenda da semana, dia a dia, ordenada por horário.                     | `prazo` como `timestamptz` + índice `(usuario, prazo)` |
| RF08 | A tarefa pode ser marcada como concluída.                                                   | `status` + `concluida_em`                           |
| RF09 | O app envia lembretes antes do prazo (ex.: 24 h e 1 h antes).                               | Entidade **Notificação** (fila de disparos)         |
| RNF01| A senha nunca é armazenada em texto claro.                                                  | Coluna `senha_hash` (bcrypt)                        |
| RNF02| Os dados de um aluno são isolados dos demais.                                               | `usuario_id` em todas as entidades                  |

### 1.2 Modelo conceitual

**Entidades**

| Entidade       | Descrição                                                                     |
| -------------- | ----------------------------------------------------------------------------- |
| **Usuário**    | Aluno que usa o app. Identificado pelo RA.                                    |
| **Disciplina** | Matéria cursada pelo aluno; agrupa tarefas e define a cor da etiqueta.        |
| **Tarefa**     | Compromisso acadêmico com prazo (prova, trabalho, leitura, entrega, outro).   |
| **Notificação**| Lembrete agendado para uma tarefa, a ser disparado num instante específico.   |

**Relacionamentos**

| Relacionamento              | Cardinalidade | Regra                                                                 |
| --------------------------- | ------------- | --------------------------------------------------------------------- |
| Usuário **cursa** Disciplina | 1 : N         | Uma disciplina pertence a exatamente um usuário.                      |
| Usuário **possui** Tarefa    | 1 : N         | Uma tarefa pertence a exatamente um usuário.                          |
| Disciplina **agrupa** Tarefa | 0..1 : N      | A tarefa pode ou não estar ligada a uma disciplina (ex.: "Reunião de grupo"). |
| Tarefa **gera** Notificação  | 1 : N         | Uma tarefa pendente tem zero ou mais lembretes.                       |
| Usuário **recebe** Notificação | 1 : N       | Destinatário do lembrete (redundância controlada, ver 1.8).           |

### 1.3 Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    USUARIOS ||--o{ DISCIPLINAS  : "cursa"
    USUARIOS ||--o{ TAREFAS      : "possui"
    DISCIPLINAS |o--o{ TAREFAS   : "agrupa"
    TAREFAS  ||--o{ NOTIFICACOES : "gera"
    USUARIOS ||--o{ NOTIFICACOES : "recebe"

    USUARIOS {
        uuid        id PK
        text        nome
        varchar8    ra UK "6 a 8 digitos"
        text        email UK "unico por lower(email)"
        text        senha_hash "bcrypt"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    DISCIPLINAS {
        uuid        id PK
        uuid        usuario_id FK
        text        nome "unico por usuario"
        text        codigo "opcional"
        char7       cor "#rrggbb"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    TAREFAS {
        uuid              id PK
        uuid              usuario_id FK
        uuid              disciplina_id FK "anulavel"
        text              titulo
        text              descricao
        tarefa_tipo       tipo
        tarefa_prioridade prioridade
        tarefa_status     status
        timestamptz       prazo
        timestamptz       concluida_em
        timestamptz       criado_em
        timestamptz       atualizado_em
    }

    NOTIFICACOES {
        uuid        id PK
        uuid        tarefa_id FK
        uuid        usuario_id FK
        timestamptz agendada_para
        timestamptz enviada_em "NULL = na fila"
        timestamptz criado_em
    }
```

> O diagrama acima é renderizado automaticamente no GitHub e no VS Code (com extensão de Mermaid).

Versão em texto:

```
┌──────────────┐ 1      N ┌──────────────┐
│   USUARIOS   │──────────│ DISCIPLINAS  │
└──────────────┘          └──────────────┘
   │1      │1                    │0..1
   │       │                     │
   │       │N                    │N
   │    ┌──────────────┐◄────────┘
   │    │   TAREFAS    │
   │    └──────────────┘
   │           │1
   │N          │N
┌──────────────────────┐
│     NOTIFICACOES     │
└──────────────────────┘
```

### 1.4 Modelo lógico — dicionário de dados

#### Tabela `usuarios`

| Coluna          | Tipo          | Nulo | Padrão              | Restrições / Observações                                  |
| --------------- | ------------- | ---- | ------------------- | --------------------------------------------------------- |
| `id`            | `uuid`        | Não  | `gen_random_uuid()` | **PK**                                                    |
| `nome`          | `text`        | Não  | —                   | `CHECK (length(trim(nome)) >= 3)`                         |
| `ra`            | `varchar(8)`  | Não  | —                   | **UNIQUE**; `CHECK (ra ~ '^[0-9]{6,8}$')`                 |
| `email`         | `text`        | Não  | —                   | `CHECK (position('@' IN email) > 1)`; único por `lower(email)` |
| `senha_hash`    | `text`        | Não  | —                   | Hash bcrypt. Nunca devolvido pela API.                    |
| `criado_em`     | `timestamptz` | Não  | `now()`             |                                                           |
| `atualizado_em` | `timestamptz` | Não  | `now()`             | Mantido pelo trigger `trg_usuarios_atualizado_em`         |

#### Tabela `disciplinas`

| Coluna          | Tipo          | Nulo | Padrão              | Restrições / Observações                                  |
| --------------- | ------------- | ---- | ------------------- | --------------------------------------------------------- |
| `id`            | `uuid`        | Não  | `gen_random_uuid()` | **PK**                                                    |
| `usuario_id`    | `uuid`        | Não  | —                   | **FK** → `usuarios(id)` `ON DELETE CASCADE`               |
| `nome`          | `text`        | Não  | —                   | `CHECK (length(trim(nome)) > 0)`                          |
| `codigo`        | `text`        | Sim  | —                   | Sigla opcional (ex.: `BD2`)                               |
| `cor`           | `char(7)`     | Sim  | —                   | `CHECK (cor ~ '^#[0-9a-fA-F]{6}$')`                       |
| `criado_em`     | `timestamptz` | Não  | `now()`             |                                                           |
| `atualizado_em` | `timestamptz` | Não  | `now()`             | Trigger `trg_disciplinas_atualizado_em`                   |
|                 |               |      |                     | **UNIQUE (`usuario_id`, `nome`)**                         |

#### Tabela `tarefas`

| Coluna          | Tipo                | Nulo | Padrão              | Restrições / Observações                              |
| --------------- | ------------------- | ---- | ------------------- | ----------------------------------------------------- |
| `id`            | `uuid`              | Não  | `gen_random_uuid()` | **PK**                                                |
| `usuario_id`    | `uuid`              | Não  | —                   | **FK** → `usuarios(id)` `ON DELETE CASCADE`           |
| `disciplina_id` | `uuid`              | Sim  | —                   | **FK** → `disciplinas(id)` `ON DELETE SET NULL`       |
| `titulo`        | `text`              | Não  | —                   | `CHECK (length(trim(titulo)) > 0)`                    |
| `descricao`     | `text`              | Sim  | —                   |                                                       |
| `tipo`          | `tarefa_tipo`       | Não  | `'outro'`           | ENUM                                                  |
| `prioridade`    | `tarefa_prioridade` | Não  | `'normal'`          | ENUM                                                  |
| `status`        | `tarefa_status`     | Não  | `'pendente'`        | ENUM                                                  |
| `prazo`         | `timestamptz`       | Não  | —                   | Instante do prazo                                     |
| `concluida_em`  | `timestamptz`       | Sim  | —                   | Preenchida somente quando `status = 'concluida'`      |
| `criado_em`     | `timestamptz`       | Não  | `now()`             |                                                       |
| `atualizado_em` | `timestamptz`       | Não  | `now()`             | Trigger `trg_tarefas_atualizado_em`                   |
|                 |                     |      |                     | **CHECK `tarefa_conclusao_coerente`**: `(status = 'concluida') = (concluida_em IS NOT NULL)` |

#### Tabela `notificacoes`

| Coluna          | Tipo          | Nulo | Padrão              | Restrições / Observações                         |
| --------------- | ------------- | ---- | ------------------- | ------------------------------------------------ |
| `id`            | `uuid`        | Não  | `gen_random_uuid()` | **PK**                                           |
| `tarefa_id`     | `uuid`        | Não  | —                   | **FK** → `tarefas(id)` `ON DELETE CASCADE`       |
| `usuario_id`    | `uuid`        | Não  | —                   | **FK** → `usuarios(id)` `ON DELETE CASCADE`      |
| `agendada_para` | `timestamptz` | Não  | —                   | Momento do disparo                               |
| `enviada_em`    | `timestamptz` | Sim  | —                   | `NULL` = ainda na fila                           |
| `criado_em`     | `timestamptz` | Não  | `now()`             |                                                  |
|                 |               |      |                     | **UNIQUE (`tarefa_id`, `agendada_para`)**        |

#### Tabela de controle `_migracoes`

Criada automaticamente pelo `npm run migrate`; registra quais scripts já foram aplicados.

| Coluna        | Tipo          | Observações                                          |
| ------------- | ------------- | ---------------------------------------------------- |
| `nome`        | `text`        | **PK** — nome do arquivo (ex.: `001_usuarios.sql`)   |
| `checksum`    | `text`        | SHA-256 (16 chars) do conteúdo do arquivo            |
| `aplicada_em` | `timestamptz` | Padrão `now()`                                       |

### 1.5 Tipos enumerados

| Tipo                | Valores                                               | Uso no app                         |
| ------------------- | ----------------------------------------------------- | ---------------------------------- |
| `tarefa_tipo`       | `prova`, `trabalho`, `leitura`, `entrega`, `outro`    | Rótulo da etiqueta do card         |
| `tarefa_prioridade` | `urgente`, `normal`                                   | Cor da etiqueta (`urgent`/`normal`)|
| `tarefa_status`     | `pendente`, `concluida`, `cancelada`                  | Etiqueta "Concluído" no card       |

### 1.6 Regras de integridade

**Integridade referencial (ações em cascata)**

| Ao excluir…     | Efeito                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| um usuário      | Apaga em cascata suas disciplinas, tarefas e notificações.                          |
| uma disciplina  | As tarefas dela **permanecem**, com `disciplina_id = NULL` (preserva o histórico).  |
| uma tarefa      | Apaga em cascata suas notificações.                                                 |

**Integridade de domínio**

- RA: somente dígitos, 6 a 8 caracteres.
- E-mail: deve conter `@` após o primeiro caractere; único sem diferenciar maiúsculas.
- Nome do usuário: no mínimo 3 caracteres úteis.
- Cor da disciplina: formato hexadecimal `#rrggbb`.
- Tarefa concluída ⇔ `concluida_em` preenchida (não existe estado intermediário).

**Triggers**

| Trigger                          | Tabela        | Evento          | Função               |
| -------------------------------- | ------------- | --------------- | -------------------- |
| `trg_usuarios_atualizado_em`     | `usuarios`    | `BEFORE UPDATE` | `set_atualizado_em()`|
| `trg_disciplinas_atualizado_em`  | `disciplinas` | `BEFORE UPDATE` | `set_atualizado_em()`|
| `trg_tarefas_atualizado_em`      | `tarefas`     | `BEFORE UPDATE` | `set_atualizado_em()`|

### 1.7 Índices

| Índice                    | Tabela         | Colunas                    | Tipo           | Finalidade                                      |
| ------------------------- | -------------- | -------------------------- | -------------- | ----------------------------------------------- |
| `usuarios_pkey`           | `usuarios`     | `id`                       | PK             |                                                 |
| `usuarios_ra_key`         | `usuarios`     | `ra`                       | Único          | Login por RA                                    |
| `usuarios_email_unico`    | `usuarios`     | `lower(email)`             | Único (expressão) | E-mail sem duplicatas por maiúscula/minúscula |
| `disciplinas_usuario_id_nome_key` | `disciplinas` | `usuario_id, nome`  | Único          | Evita disciplina repetida para o mesmo aluno    |
| `tarefas_agenda`          | `tarefas`      | `usuario_id, prazo`        | Composto       | Consulta da agenda semanal (filtro + ordenação) |
| `tarefas_disciplina`      | `tarefas`      | `disciplina_id`            | Simples        | Acelera o `SET NULL` ao excluir disciplina      |
| `notificacoes_tarefa_id_agendada_para_key` | `notificacoes` | `tarefa_id, agendada_para` | Único | Idempotência dos lembretes |
| `notificacoes_pendentes`  | `notificacoes` | `agendada_para` `WHERE enviada_em IS NULL` | Parcial | Fila do worker de envio |

Consulta principal atendida pelo índice `tarefas_agenda`:

```sql
SELECT *
  FROM tarefas
 WHERE usuario_id = $1
   AND prazo >= $2   -- segunda-feira 00:00
   AND prazo <  $3   -- sábado 00:00
 ORDER BY prazo;
```

### 1.8 Decisões de modelagem

1. **Chaves `uuid`** em vez de `serial`: os IDs aparecem nas URLs da API e não revelam quantos registros existem nem permitem adivinhar o ID de outro aluno.
2. **`prazo` como `timestamptz`** em vez do texto "Até 23:59" do protótipo: sem um instante real não há ordenação, filtro por semana nem agendamento de notificações. O texto passa a ser formatado no app.
3. **A antiga `tag` foi decomposta em três colunas** (`tipo`, `prioridade`, `status`): no protótipo ela misturava categoria ("Prova"), prioridade ("Urgente") e estado ("Concluído").
4. **Disciplina em tabela própria** (normalização — 3FN): evita repetir o nome da matéria (e erros de digitação) em cada tarefa, e guarda a cor da etiqueta.
5. **`notificacoes.usuario_id` redundante** (desnormalização controlada): o worker de envio sabe o destinatário sem precisar de `JOIN` com `tarefas`.
6. **Regras de negócio no banco** (`CHECK`, `UNIQUE`, triggers): a validação de tela é conveniência; a integridade é garantida mesmo quando os dados chegam por `psql`, seed ou correção manual.
7. **ENUMs do PostgreSQL** para conjuntos fechados de valores, espelhados nos tipos TypeScript em `src/backend/src/types/dominio.ts`.

---

## 2. Criar o database

### 2.1 Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- Node.js 20+
- Dependências do backend instaladas:

```powershell
cd prazzo\backend
npm install
Copy-Item .env.example .env   # Linux/macOS: cp .env.example .env
```

### 2.2 Subir o servidor PostgreSQL

O arquivo `src/backend/docker-compose.yml` cria o container `prazzo-db` já com o banco `prazzo`, o usuário `prazzo` e o fuso `America/Sao_Paulo`:

```powershell
cd prazzo\backend
npm run db:up        # = docker compose up -d --wait
```

O `--wait` segura o terminal até o healthcheck (`pg_isready`) confirmar que o banco aceita conexões.

> **Sem Docker?** Com um PostgreSQL instalado localmente, crie o banco manualmente:
>
> ```sql
> CREATE USER prazzo WITH PASSWORD 'prazzo';
> CREATE DATABASE prazzo OWNER prazzo ENCODING 'UTF8';
> ALTER DATABASE prazzo SET timezone TO 'America/Sao_Paulo';
> ```
>
> e ajuste `DATABASE_URL` no `.env` se o host/porta forem diferentes.

### 2.3 Aplicar as migrations

```powershell
npm run migrate
```

Saída esperada na primeira execução:

```
[migrate] + 001_usuarios.sql
[migrate] + 002_disciplinas.sql
[migrate] + 003_tarefas.sql
[migrate] + 004_notificacoes.sql
[migrate] 4 migration(s) aplicada(s).
```

Características do aplicador (`src/database/migrate.ts`):

- Cada arquivo roda em **transação própria** — se falhar, nada fica pela metade.
- É **idempotente** — rodar de novo só imprime `(ja aplicada)`.
- Guarda um **checksum**; se uma migration já aplicada for editada, o comando falha. Mudanças de schema devem ir num arquivo novo (`005_...sql`).

### 2.4 Popular com dados de exemplo

```powershell
npm run seed
```

Cria o usuário de demonstração e reproduz a semana do protótipo:

| Dado           | Valor                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Usuário        | Maria Silva — RA `12345678` — senha `prazzo123`                               |
| Disciplinas    | Banco de Dados II, Engenharia de Software, Algoritmos, Redes de Computadores  |
| Tarefas        | 5 (seg: Reunião de grupo ✔ · ter: Entrega de BD II, Artigo de Eng. SW · qua: Prova P1 de Algoritmos · sex: Apresentação de Redes) |
| Notificações   | 8 (24 h e 1 h antes de cada tarefa pendente)                                  |

O seed é idempotente: apaga o usuário de exemplo (o `CASCADE` leva o resto) e recria.

### 2.5 Script SQL completo (DDL)

Consolidação das quatro migrations, para execução direta via `psql` ou ferramenta gráfica (DBeaver, pgAdmin). **Prefira `npm run migrate`** — ele registra a tabela de controle `_migracoes`.

```sql
-- =============================================================
-- PRAZZO - Criação do schema
-- PostgreSQL 13+ (gen_random_uuid() nativo)
-- =============================================================

-- ---------- Função comum de auditoria ----------
CREATE OR REPLACE FUNCTION set_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- 001 - usuarios ----------
CREATE TABLE usuarios (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text        NOT NULL CHECK (length(trim(nome)) >= 3),
  ra            varchar(8)  NOT NULL UNIQUE CHECK (ra ~ '^[0-9]{6,8}$'),
  email         text        NOT NULL CHECK (position('@' IN email) > 1),
  senha_hash    text        NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------- 002 - disciplinas ----------
CREATE TABLE disciplinas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome          text        NOT NULL CHECK (length(trim(nome)) > 0),
  codigo        text,
  cor           char(7)     CHECK (cor ~ '^#[0-9a-fA-F]{6}$'),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, nome)
);

CREATE TRIGGER trg_disciplinas_atualizado_em
  BEFORE UPDATE ON disciplinas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------- 003 - tarefas ----------
CREATE TYPE tarefa_tipo       AS ENUM ('prova', 'trabalho', 'leitura', 'entrega', 'outro');
CREATE TYPE tarefa_prioridade AS ENUM ('urgente', 'normal');
CREATE TYPE tarefa_status     AS ENUM ('pendente', 'concluida', 'cancelada');

CREATE TABLE tarefas (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid              NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
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
  CONSTRAINT tarefa_conclusao_coerente
    CHECK ((status = 'concluida') = (concluida_em IS NOT NULL))
);

CREATE INDEX tarefas_agenda     ON tarefas (usuario_id, prazo);
CREATE INDEX tarefas_disciplina ON tarefas (disciplina_id);

CREATE TRIGGER trg_tarefas_atualizado_em
  BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------- 004 - notificacoes ----------
CREATE TABLE notificacoes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id     uuid        NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  usuario_id    uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  agendada_para timestamptz NOT NULL,
  enviada_em    timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tarefa_id, agendada_para)
);

CREATE INDEX notificacoes_pendentes ON notificacoes (agendada_para)
  WHERE enviada_em IS NULL;
```

### 2.6 Verificação

Abrir o terminal SQL dentro do container:

```powershell
docker exec -it prazzo-db psql -U prazzo -d prazzo
```

Comandos de conferência:

```sql
\dt                       -- lista as tabelas (usuarios, disciplinas, tarefas, notificacoes, _migracoes)
\dT                       -- lista os ENUMs
\d tarefas                -- estrutura, índices, FKs e CHECKs da tabela

SELECT nome, aplicada_em FROM _migracoes ORDER BY nome;

-- Agenda da semana do usuário de exemplo
SELECT to_char(t.prazo, 'Dy DD/MM HH24:MI') AS quando,
       t.titulo, t.tipo, t.prioridade, t.status,
       d.nome AS disciplina
  FROM tarefas t
  JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN disciplinas d ON d.id = t.disciplina_id
 WHERE u.ra = '12345678'
 ORDER BY t.prazo;
```

Pelo backend: com a API rodando (`npm run dev`), `GET http://localhost:3333/health` informa se o banco está respondendo.

### 2.7 Comandos úteis

Executar dentro de `src/backend`:

| Comando            | O que faz                                                         |
| ------------------ | ----------------------------------------------------------------- |
| `npm run db:up`    | Sobe o PostgreSQL e espera ficar pronto                           |
| `npm run db:down`  | Para o container (os dados são mantidos no volume)                |
| `npm run migrate`  | Aplica as migrations pendentes                                    |
| `npm run seed`     | Recria os dados de exemplo                                        |
| `npm run db:reset` | **Apaga tudo** e recria do zero: down -v → up → migrate → seed    |
