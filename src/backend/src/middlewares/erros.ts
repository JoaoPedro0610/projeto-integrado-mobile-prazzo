/**
 * Erros da aplicacao e o handler que os transforma em resposta HTTP.
 */
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

/**
 * Erro que o cliente precisa ver.
 *
 * Existe para separar duas coisas que nao podem virar a mesma resposta: "o RA
 * ja esta cadastrado" (culpa do pedido, status 409, mensagem util) e "a conexao
 * com o banco caiu" (culpa nossa, status 500, detalhe que nao se expoe).
 */
export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    message: string,
    /**
     * Erro por campo, quando o problema e de formulario. O app usa este mapa
     * para marcar a mensagem embaixo do Input certo, em vez de mostrar um
     * alerta generico - e o formato que o `FormErrors` das telas espera.
     */
    readonly campos?: Readonly<Record<string, string>>
  ) {
    super(message);
    this.name = "ErroHttp";
  }
}

/**
 * Handler de erros do Express.
 *
 * Precisa declarar os QUATRO parametros. O Express identifica um handler de
 * erro pela aridade da funcao: com tres, ele o registra como middleware comum e
 * nenhum erro chega aqui. Por isso `_next` fica declarado mesmo sem uso.
 */
export function tratarErros(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({
      erro: erro.message,
      ...(erro.campos ? { campos: erro.campos } : {}),
    });
    return;
  }

  // Inesperado: registra o detalhe no servidor e devolve uma mensagem generica.
  // Mensagem de erro de banco costuma citar tabela, coluna e valor - material
  // de reconhecimento para quem esta sondando a API.
  console.error("[PRAZZO] erro nao tratado:", erro);

  res.status(500).json({
    erro: "Erro interno no servidor.",
    ...(env.isProduction
      ? {}
      : { detalhe: erro instanceof Error ? erro.message : String(erro) }),
  });
}

/** 404 para rota inexistente, no formato de erro que o resto da API usa. */
export function rotaNaoEncontrada(req: Request, res: Response): void {
  res.status(404).json({ erro: `Rota nao encontrada: ${req.method} ${req.path}` });
}
