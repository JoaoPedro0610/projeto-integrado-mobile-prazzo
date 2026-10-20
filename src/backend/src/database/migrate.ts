/**
 * Aplicador de migrations.  Uso: `npm run migrate`
 *
 * Le os arquivos de `backend/migrations/`, aplica os que ainda faltam e
 * registra cada um na tabela de controle `_migracoes`. Rodar duas vezes
 * seguidas nao faz nada na segunda - e seguro chamar sempre que subir o banco.
 *
 * Cada migration roda dentro da sua propria transacao. No Postgres o DDL e
 * transacional (diferente do MySQL), entao um `CREATE TYPE` que falha no meio
 * do arquivo nao deixa metade do schema criado: volta tudo e a migration
 * continua marcada como pendente.
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { fecharPool, query, withTransaction } from "./pool";

/**
 * `../../migrations` funciona tanto rodando por `tsx` (a partir de
 * `src/database/`) quanto compilado (a partir de `dist/database/`), porque os
 * dois ficam a dois niveis da raiz do backend. Usar `process.cwd()` aqui
 * quebraria se alguem rodasse o script de outra pasta.
 */
const DIRETORIO_MIGRATIONS = path.resolve(__dirname, "..", "..", "migrations");

type LinhaMigracao = { nome: string; checksum: string };

/** Identifica o conteudo do arquivo, para detectar migration editada depois de aplicada. */
function calcularChecksum(conteudo: string): string {
  return createHash("sha256").update(conteudo).digest("hex").slice(0, 16);
}

async function garantirTabelaDeControle(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migracoes (
      nome        text        PRIMARY KEY,
      checksum    text        NOT NULL,
      aplicada_em timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function aplicarMigrations(): Promise<void> {
  await garantirTabelaDeControle();

  // A ordenacao alfabetica e suficiente por causa do prefixo numerico de tres
  // digitos (001, 002...). Passar de 999 arquivos, ou numerar sem zeros a
  // esquerda, quebraria a ordem - por isso o padrao do nome importa.
  const arquivos = (await readdir(DIRETORIO_MIGRATIONS))
    .filter((nome) => nome.endsWith(".sql"))
    .sort();

  if (arquivos.length === 0) {
    console.log("[migrate] nenhum arquivo .sql em migrations/");
    return;
  }

  const registradas = new Map(
    (await query<LinhaMigracao>("SELECT nome, checksum FROM _migracoes")).map(
      (linha) => [linha.nome, linha.checksum]
    )
  );

  let aplicadas = 0;

  for (const nome of arquivos) {
    const sql = await readFile(path.join(DIRETORIO_MIGRATIONS, nome), "utf8");
    const checksum = calcularChecksum(sql);
    const checksumRegistrado = registradas.get(nome);

    if (checksumRegistrado !== undefined) {
      // Editar uma migration ja aplicada e a origem classica do "no meu
      // computador funciona": o banco de quem editou tem o conteudo antigo, e
      // o de quem clonou depois tem o novo. Melhor falhar alto.
      if (checksumRegistrado !== checksum) {
        throw new Error(
          `A migration "${nome}" foi alterada depois de ter sido aplicada.\n` +
            `  Crie um arquivo novo com a mudanca, ou recomece o banco do zero:\n` +
            `  docker compose down -v && docker compose up -d --wait && npm run migrate`
        );
      }

      console.log(`[migrate] = ${nome} (ja aplicada)`);
      continue;
    }

    await withTransaction(async (cliente) => {
      await cliente.query(sql);
      await cliente.query(
        "INSERT INTO _migracoes (nome, checksum) VALUES ($1, $2)",
        [nome, checksum]
      );
    });

    console.log(`[migrate] + ${nome}`);
    aplicadas += 1;
  }

  console.log(
    aplicadas === 0
      ? "[migrate] banco ja estava atualizado."
      : `[migrate] ${aplicadas} migration(s) aplicada(s).`
  );
}

// Executado apenas quando o arquivo e chamado direto (`npm run migrate`), e
// nao quando algum teste futuro importar `aplicarMigrations`.
if (require.main === module) {
  aplicarMigrations()
    .catch((erro: unknown) => {
      console.error(
        "[migrate] falhou:",
        erro instanceof Error ? erro.message : erro
      );
      process.exitCode = 1;
    })
    .finally(fecharPool);
}
