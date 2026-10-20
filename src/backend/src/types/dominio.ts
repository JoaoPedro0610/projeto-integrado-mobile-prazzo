/**
 * Tipos do dominio do PRAZZO.
 *
 * Espelham as tabelas de `migrations/`, mas em camelCase - a conversao dos
 * nomes acontece no proprio SELECT, com alias entre aspas
 * (`criado_em AS "criadoEm"`), para nao existir uma camada de traducao
 * escondida entre o SQL e o TypeScript.
 */

/** Igual ao ENUM `tarefa_tipo` da migration 003. */
export type TarefaTipo = "prova" | "trabalho" | "leitura" | "entrega" | "outro";

/** Igual ao ENUM `tarefa_prioridade`. Mesmos valores do `TaskPriority` do app. */
export type TarefaPrioridade = "urgente" | "normal";

/** Igual ao ENUM `tarefa_status`. */
export type TarefaStatus = "pendente" | "concluida" | "cancelada";

/**
 * Usuario como ele sai da API.
 *
 * Nao existe campo de senha aqui de proposito: e o que impede o hash de vazar
 * numa resposta por descuido de `res.json(usuario)`. Quem precisa do hash usa
 * `UsuarioComSenha`, que so circula dentro do fluxo de login.
 */
export type Usuario = {
  id: string;
  nome: string;
  ra: string;
  email: string;
  criadoEm: Date;
  atualizadoEm: Date;
};

/**
 * Usuario + hash, usado unicamente para conferir a senha no login.
 * Nunca deve ser devolvido por um controller.
 */
export type UsuarioComSenha = Usuario & { senhaHash: string };

/**
 * O que o repositorio precisa para criar um usuario.
 *
 * Recebe `senhaHash`, nao a senha em claro: o bcrypt fica no controller de
 * autenticacao, e o repositorio continua sendo so acesso a dados.
 */
export type DadosNovoUsuario = {
  nome: string;
  ra: string;
  email: string;
  senhaHash: string;
};

export type Disciplina = {
  id: string;
  usuarioId: string;
  nome: string;
  codigo: string | null;
  cor: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type Tarefa = {
  id: string;
  usuarioId: string;
  disciplinaId: string | null;
  titulo: string;
  descricao: string | null;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  status: TarefaStatus;
  /** Instante do prazo. O texto "Ate 23:59" e formatado no app a partir daqui. */
  prazo: Date;
  concluidaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type Notificacao = {
  id: string;
  tarefaId: string;
  usuarioId: string;
  agendadaPara: Date;
  /** `null` enquanto o disparo ainda esta na fila. */
  enviadaEm: Date | null;
  criadoEm: Date;
};

/** Conteudo assinado dentro do JWT. So o minimo para identificar o usuario. */
export type TokenPayload = {
  sub: string;
  ra: string;
};
