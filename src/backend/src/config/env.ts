/**
 * Carregamento centralizado das variaveis de ambiente.
 *
 * Todo o resto do projeto importa daqui (`import { env } from "../config/env"`)
 * em vez de ler `process.env` espalhado pelo codigo. Assim, se faltar alguma
 * variavel, o servidor avisa na hora de subir e nao no meio de uma requisicao.
 */
import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(
      `Variavel de ambiente "${name}" nao definida. ` +
        `Copie o arquivo .env.example para .env e preencha os valores.`
    );
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? "development",

  /** Usado para assinar/validar os JWT (ETAPA 2). */
  jwtSecret: required("JWT_SECRET", "prazzo-dev-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",

  /**
   * Conexao com o Postgres (ETAPA 4).
   *
   * O fallback e exatamente o que o `docker-compose.yml` desta pasta cria.
   * Isso e deliberado: quem subiu o banco com `docker compose up -d` roda
   * `npm run dev` sem precisar editar o proprio `.env`. Sem o fallback, a
   * variavel nova quebraria o `npm run dev` de todo o grupo de uma vez.
   */
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://prazzo:prazzo@localhost:5432/prazzo"
  ),

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  },
} as const;
