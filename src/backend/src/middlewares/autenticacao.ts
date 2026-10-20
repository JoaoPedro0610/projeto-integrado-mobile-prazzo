/**
 * Autenticacao por JWT.
 *
 * `autenticar` valida o token e anexa o payload em `req.usuario`.
 * `usuarioDoPedido` le esse payload dentro dos controllers.
 */
import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import type { TokenPayload } from "../types";
import { ErroHttp } from "./erros";

declare global {
  namespace Express {
    interface Request {
      /** Preenchido por `autenticar`. Ausente em rota publica. */
      usuario?: TokenPayload;
    }
  }
}

/** Gera o token devolvido no cadastro e no login. */
export function gerarToken(payload: TokenPayload): string {
  // O cast existe porque `expiresIn` nao aceita `string` solto nos tipos do
  // jsonwebtoken: ele espera o formato de duracao ("15m", "1d"). O valor vem do
  // .env, entao so ha como garantir o formato em tempo de execucao.
  const opcoes: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwtSecret, opcoes);
}

/** Middleware: exige `Authorization: Bearer <token>` valido. */
export function autenticar(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const cabecalho = req.headers.authorization;

  if (!cabecalho?.startsWith("Bearer ")) {
    throw new ErroHttp(401, "Token de acesso nao informado.");
  }

  const token = cabecalho.slice("Bearer ".length).trim();

  try {
    const conteudo = jwt.verify(token, env.jwtSecret);

    // `verify` devolve `string | JwtPayload`: string quando o token foi assinado
    // com um payload que nao e objeto. Sem esta checagem, um token assim
    // passaria e `req.usuario.sub` seria undefined em tempo de execucao.
    if (typeof conteudo === "string" || typeof conteudo.sub !== "string") {
      throw new ErroHttp(401, "Token invalido.");
    }

    req.usuario = { sub: conteudo.sub, ra: String(conteudo.ra ?? "") };
    next();
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      throw erro;
    }
    // Distinguir expirado de malformado ajuda o app a decidir entre renovar o
    // token e mandar o usuario para a tela de login.
    if (erro instanceof jwt.TokenExpiredError) {
      throw new ErroHttp(401, "Sessao expirada. Entre novamente.");
    }
    throw new ErroHttp(401, "Token invalido.");
  }
}

/**
 * Le o usuario autenticado dentro de um controller.
 *
 * Devolve o payload nao-opcional, para o controller nao precisar tratar um
 * `undefined` que so aconteceria se a rota tivesse esquecido o `autenticar`.
 * Se acontecer, e bug de configuracao de rota - e o 500 esta correto.
 */
export function usuarioDoPedido(req: Request): TokenPayload {
  if (!req.usuario) {
    throw new Error(
      "Rota sem o middleware `autenticar`: req.usuario nao foi preenchido."
    );
  }
  return req.usuario;
}
