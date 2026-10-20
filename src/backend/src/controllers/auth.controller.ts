/**
 * Cadastro, login e "quem sou eu".
 *
 * As regras de validacao repetem as de `app/src/screens/RegisterScreen.tsx` de
 * proposito: a tela evita uma ida ao servidor por erro obvio, mas quem decide e
 * este lado - o app pode ser alterado, e a API responde a qualquer cliente.
 *
 * Nao ha try/catch em volta dos `await`: o Express 5 encaminha a rejeicao de um
 * handler async para o middleware de erro sozinho, o que o Express 4 nao fazia.
 */
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { gerarToken, usuarioDoPedido } from "../middlewares/autenticacao";
import { ErroHttp } from "../middlewares/erros";
import { usuariosRepository } from "../repositories/usuarios.repository";

/** Mesmos limites da tela de cadastro. */
const NOME_MIN = 3;
const SENHA_MIN = 6;
const RA_PADRAO = /^[0-9]{6,8}$/;
const EMAIL_PADRAO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Custo do bcrypt. 10 rodadas levam ~100 ms nesta classe de maquina: caro o
 * suficiente para forca bruta, rapido o suficiente para o login nao travar.
 */
const CUSTO_BCRYPT = 10;

/** Campos que o app usa para marcar o erro embaixo do Input correspondente. */
type ErrosDeCampo = Partial<Record<"nome" | "ra" | "email" | "senha", string>>;

/**
 * `req.body` vem de fora e pode ser qualquer coisa - inclusive numero, objeto
 * ou ausente. Reduz tudo a string antes de validar, para as checagens abaixo
 * nao estourarem em `.trim()` de um `undefined`.
 */
function lerTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/**
 * Recusa o pedido com o mapa de campos, no formato que o `FormErrors` do app
 * espera.
 *
 * O status e parametro porque as duas recusas sao coisas diferentes: formato
 * errado e 400, e "ja cadastrado" e 409 (conflito com o estado atual). O 409
 * tem de ser o mesmo que o repositorio devolve ao traduzir a violacao de
 * unicidade - senao o app receberia 400 ou 409 para a MESMA situacao,
 * dependendo de a checagem antecipada ter pegado ou nao.
 */
function recusarCampos(campos: ErrosDeCampo, status = 400): never {
  throw new ErroHttp(
    status,
    status === 409 ? "Cadastro em conflito." : "Dados invalidos.",
    campos
  );
}

/** POST /auth/registrar */
export async function registrar(req: Request, res: Response): Promise<void> {
  const nome = lerTexto(req.body?.nome).trim();
  const ra = lerTexto(req.body?.ra).trim();
  const email = lerTexto(req.body?.email).trim();
  const senha = lerTexto(req.body?.senha);

  const campos: ErrosDeCampo = {};

  if (nome.length < NOME_MIN) {
    campos.nome = "Informe o seu nome completo.";
  }
  if (!RA_PADRAO.test(ra)) {
    campos.ra = "O RA deve ter de 6 a 8 digitos.";
  }
  if (!EMAIL_PADRAO.test(email)) {
    campos.email = "Informe um e-mail valido.";
  }
  if (senha.length < SENHA_MIN) {
    campos.senha = `A senha deve ter ao menos ${SENHA_MIN} caracteres.`;
  }

  if (Object.keys(campos).length > 0) {
    recusarCampos(campos);
  }

  // Checagem antecipada so para dar a mensagem no campo certo. A garantia real
  // e a restricao UNIQUE - o repositorio traduz a violacao se alguem cadastrar
  // o mesmo RA entre esta consulta e o INSERT.
  if (await usuariosRepository.raEmUso(ra)) {
    recusarCampos({ ra: "Este RA ja esta cadastrado." }, 409);
  }
  if (await usuariosRepository.emailEmUso(email)) {
    recusarCampos({ email: "Este e-mail ja esta cadastrado." }, 409);
  }

  const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT);
  const usuario = await usuariosRepository.criar({ nome, ra, email, senhaHash });

  // Ja devolve o token: depois de criar a conta o app entra direto no
  // Dashboard, como o `navigation.reset` da RegisterScreen faz hoje.
  res.status(201).json({
    token: gerarToken({ sub: usuario.id, ra: usuario.ra }),
    usuario,
  });
}

/** POST /auth/login */
export async function entrar(req: Request, res: Response): Promise<void> {
  const ra = lerTexto(req.body?.ra).trim();
  const senha = lerTexto(req.body?.senha);

  if (ra.length === 0 || senha.length === 0) {
    recusarCampos({
      ...(ra.length === 0 ? { ra: "Informe o seu RA." } : {}),
      ...(senha.length === 0 ? { senha: "Informe a sua senha." } : {}),
    });
  }

  const encontrado = await usuariosRepository.buscarPorRaComSenha(ra);

  // Mesma mensagem para "RA inexistente" e "senha errada". Diferenciar as duas
  // entregaria a quem tentar adivinhar uma lista de RAs cadastrados.
  const generico = "RA ou senha incorretos.";

  if (!encontrado) {
    throw new ErroHttp(401, generico);
  }

  const senhaConfere = await bcrypt.compare(senha, encontrado.senhaHash);

  if (!senhaConfere) {
    throw new ErroHttp(401, generico);
  }

  // Remove o hash antes de responder. O `senhaHash` fica so nesta funcao.
  const { senhaHash: _naoResponder, ...usuario } = encontrado;

  res.json({
    token: gerarToken({ sub: usuario.id, ra: usuario.ra }),
    usuario,
  });
}

/** GET /auth/eu - confere o token e devolve o usuario dono dele. */
export async function eu(req: Request, res: Response): Promise<void> {
  const { sub } = usuarioDoPedido(req);
  const usuario = await usuariosRepository.buscarPorId(sub);

  // Token valido de uma conta que nao existe mais: assinatura correta, dono
  // apagado. E 404, nao 500.
  if (!usuario) {
    throw new ErroHttp(404, "Usuario nao encontrado.");
  }

  res.json({ usuario });
}
