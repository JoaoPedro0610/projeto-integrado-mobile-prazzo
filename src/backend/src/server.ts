/**
 * PRAZZO - ponto de entrada da API.
 *
 * ETAPA 4: Postgres integrado. As rotas de autenticacao vem de `src/routes/` e
 * todo acesso a dados passa por `src/repositories/`.
 */
import express, { type Request, type Response } from "express";
import cors from "cors";

import { env } from "./config/env";
import { bancoRespondendo, fecharPool } from "./database/pool";
import { rotaNaoEncontrada, tratarErros } from "./middlewares/erros";
import { routes } from "./routes";

const app = express();

// --- Middlewares globais ---------------------------------------------------
app.use(cors()); // libera o acesso do app Expo (rodando em outra porta/dispositivo)
app.use(express.json()); // interpreta o corpo das requisicoes em JSON

// --- Rotas -----------------------------------------------------------------
/**
 * Health check: confere de verdade se o banco responde, em vez de so dizer que
 * o processo do Node esta no ar. Devolve 503 quando o Postgres nao responde -
 * assim `curl -f /health` falha e o problema aparece na hora, e nao na
 * primeira tentativa de login.
 */
app.get("/health", async (_req: Request, res: Response) => {
  const banco = await bancoRespondendo();

  res.status(banco ? 200 : 503).json({
    status: banco ? "ok" : "degradado",
    app: "PRAZZO API",
    banco: banco ? "conectado" : "indisponivel",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use(routes);

// --- Tratamento de erros ---------------------------------------------------
// Depois de todas as rotas: o que chegou aqui nao casou com nenhuma.
app.use(rotaNaoEncontrada);

// Sempre o ULTIMO `app.use`. Registrado antes das rotas, nenhum erro delas
// passaria por ele.
app.use(tratarErros);

// --- Subida do servidor ----------------------------------------------------
const servidor = app.listen(env.port, () => {
  console.log(`[PRAZZO] API rodando em http://localhost:${env.port}`);
  console.log(`[PRAZZO] Health check: http://localhost:${env.port}/health`);
});

/**
 * Encerramento limpo.
 *
 * Sem isso, o Ctrl+C mata o processo com conexoes abertas no Postgres, que
 * ficam alguns minutos como sessoes ociosas no servidor. Em desenvolvimento, com
 * o `tsx watch` reiniciando a cada salvamento, essas sobras acumulam rapido e
 * chegam a esgotar o limite de conexoes.
 */
for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    console.log(`\n[PRAZZO] ${sinal} recebido, encerrando...`);

    servidor.close(() => {
      void fecharPool().finally(() => process.exit(0));
    });
  });
}
