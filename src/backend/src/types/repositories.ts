/**
 * Contratos de acesso a dados.
 *
 * Os controllers dependem destas interfaces, nunca da implementacao - e o que
 * mantem a promessa do README: trocar o que ha dentro de
 * `src/repositories/` nao mexe em controller nem em rota.
 *
 * As interfaces de disciplinas, tarefas e notificacoes entram nas ETAPAS 5 e 6,
 * junto das respectivas implementacoes.
 */
import type { DadosNovoUsuario, Usuario, UsuarioComSenha } from "./dominio";

export interface UsuariosRepository {
  criar(dados: DadosNovoUsuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Usado no login: e o unico lugar que precisa do hash da senha. */
  buscarPorRaComSenha(ra: string): Promise<UsuarioComSenha | null>;
  raEmUso(ra: string): Promise<boolean>;
  emailEmUso(email: string): Promise<boolean>;
}
