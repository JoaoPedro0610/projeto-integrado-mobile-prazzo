/**
 * Pool de conexoes com o Postgres.
 *
 * Todo acesso a dados passa por aqui - `src/repositories/` importa `query` e
 * `withTransaction` deste arquivo, e ninguem mais instancia um `Pool`. Um
 * pool por processo e o ponto: cada `new Pool()` abriria mais um conjunto de
 * conexoes, e o Postgres tem um limite baixo por padrao (100 no total).
 */
import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  // 10 conexoes sobram para uma API de trabalho academico e deixam folga no
  // limite do servidor para o psql e para os outros integrantes do grupo.
  max: 10,
  idleTimeoutMillis: 30_000,
  // Sem timeout de conexao, um banco no ar mas sem responder deixa a
  // requisicao pendurada indefinidamente em vez de devolver erro.
  connectionTimeoutMillis: 5_000,
});

/**
 * Um cliente ocioso pode falhar sozinho quando o container do banco reinicia
 * ou a rede cai. Esse erro chega ao pool de forma assincrona, fora de
 * qualquer `await`: sem este listener o Node o trata como excecao nao
 * capturada e derruba a API inteira por causa de uma conexao parada.
 */
pool.on("error", (erro) => {
  console.error("[PRAZZO] erro em cliente ocioso do Postgres:", erro.message);
});

/**
 * Executa uma consulta e devolve so as linhas.
 *
 * Os parametros vao SEMPRE como `$1, $2...` no segundo argumento, nunca
 * interpolados na string do SQL - e o que impede injecao de SQL.
 */
export async function query<T extends QueryResultRow>(
  sql: string,
  parametros: readonly unknown[] = []
): Promise<T[]> {
  const resultado = await pool.query<T>(sql, parametros as unknown[]);
  return resultado.rows;
}

/**
 * Igual a `query`, para quando a consulta devolve no maximo uma linha.
 * Devolve `null` em vez de `undefined` porque e o que as interfaces dos
 * repositories prometem (`Promise<Usuario | null>`).
 */
export async function queryUm<T extends QueryResultRow>(
  sql: string,
  parametros: readonly unknown[] = []
): Promise<T | null> {
  const linhas = await query<T>(sql, parametros);
  return linhas[0] ?? null;
}

/**
 * Roda `fn` dentro de uma transacao: commita no fim ou desfaz tudo se
 * qualquer coisa lancar.
 *
 * O `client` tem que ser o mesmo do inicio ao fim - por isso ele e retirado
 * do pool e passado adiante. Usar `pool.query` no meio de uma transacao
 * pegaria OUTRA conexao, que nao esta dentro do BEGIN, e a metade do
 * trabalho escaparia do rollback.
 */
export async function withTransaction<T>(
  fn: (cliente: PoolClient) => Promise<T>
): Promise<T> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    // Sem o release a conexao nunca volta ao pool: depois de 10 erros a API
    // congela esperando uma conexao que nao existe mais.
    cliente.release();
  }
}

/** Usado pelo `/health` para dizer se o banco esta realmente respondendo. */
export async function bancoRespondendo(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/** Fecha o pool. Chamado pelos scripts (migrate, seed) para o Node encerrar. */
export async function fecharPool(): Promise<void> {
  await pool.end();
}
