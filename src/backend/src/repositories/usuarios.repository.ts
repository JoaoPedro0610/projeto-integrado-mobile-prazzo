/**
 * Acesso a dados de usuarios (Postgres).
 *
 * Implementa `UsuariosRepository` de `src/types/`. Nenhum controller conhece
 * SQL, e este arquivo nao conhece Express nem bcrypt - recebe o hash pronto.
 */
import { query, queryUm } from "../database/pool";
import { ErroHttp } from "../middlewares/erros";
import type {
  DadosNovoUsuario,
  Usuario,
  UsuarioComSenha,
  UsuariosRepository,
} from "../types";

/**
 * Lista de colunas com alias em camelCase.
 *
 * As aspas duplas sao obrigatorias: sem elas o Postgres devolveria a coluna em
 * minusculas ("criadoem") e o objeto nao casaria com o tipo `Usuario`.
 *
 * `senha_hash` NAO esta aqui de proposito - so a consulta de login a inclui.
 */
const CAMPOS = `
  id,
  nome,
  ra,
  email,
  criado_em     AS "criadoEm",
  atualizado_em AS "atualizadoEm"
`;

/** Nomes que o Postgres da as restricoes unicas criadas na migration 001. */
const RESTRICAO_RA = "usuarios_ra_key";
const RESTRICAO_EMAIL = "usuarios_email_unico";

/** `true` quando o erro do pg e violacao de unicidade (SQLSTATE 23505). */
function ehViolacaoDeUnicidade(
  erro: unknown
): erro is { code: string; constraint?: string } {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    (erro as { code: unknown }).code === "23505"
  );
}

export const usuariosRepository: UsuariosRepository = {
  async criar(dados: DadosNovoUsuario): Promise<Usuario> {
    try {
      const criado = await queryUm<Usuario>(
        `INSERT INTO usuarios (nome, ra, email, senha_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING ${CAMPOS}`,
        [
          dados.nome.trim(),
          dados.ra,
          // Normaliza aqui, e nao no controller, para que TODO caminho de
          // escrita grave no mesmo formato do indice `usuarios_email_unico`,
          // que e sobre `lower(email)`.
          dados.email.trim().toLowerCase(),
          dados.senhaHash,
        ]
      );

      if (!criado) {
        throw new Error("INSERT em usuarios nao devolveu linha.");
      }

      return criado;
    } catch (erro) {
      // O controller ja checa RA e e-mail antes de chamar, mas entre a checagem
      // e o INSERT cabe outro cadastro com o mesmo RA. Quem decide de verdade e
      // a restricao do banco.
      //
      // A resposta e IGUAL a da checagem antecipada - mesmo status e mesmo mapa
      // de campos - para o app nao ter que lidar com dois formatos para a mesma
      // situacao, dependendo de qual dos dois caminhos pegou o conflito.
      if (ehViolacaoDeUnicidade(erro)) {
        if (erro.constraint === RESTRICAO_RA) {
          throw new ErroHttp(409, "Cadastro em conflito.", {
            ra: "Este RA ja esta cadastrado.",
          });
        }
        if (erro.constraint === RESTRICAO_EMAIL) {
          throw new ErroHttp(409, "Cadastro em conflito.", {
            email: "Este e-mail ja esta cadastrado.",
          });
        }
      }

      throw erro;
    }
  },

  async buscarPorId(id: string): Promise<Usuario | null> {
    return queryUm<Usuario>(
      `SELECT ${CAMPOS} FROM usuarios WHERE id = $1`,
      [id]
    );
  },

  async buscarPorRaComSenha(ra: string): Promise<UsuarioComSenha | null> {
    return queryUm<UsuarioComSenha>(
      `SELECT ${CAMPOS}, senha_hash AS "senhaHash"
         FROM usuarios
        WHERE ra = $1`,
      [ra]
    );
  },

  async raEmUso(ra: string): Promise<boolean> {
    const linhas = await query(`SELECT 1 FROM usuarios WHERE ra = $1`, [ra]);
    return linhas.length > 0;
  },

  async emailEmUso(email: string): Promise<boolean> {
    // `lower(email)` nos dois lados para a consulta usar o indice
    // `usuarios_email_unico`, que e sobre a expressao e nao sobre a coluna.
    const linhas = await query(
      `SELECT 1 FROM usuarios WHERE lower(email) = lower($1)`,
      [email]
    );
    return linhas.length > 0;
  },
};
