/**
 * Rotas de autenticacao, montadas em `/auth` por `src/routes/index.ts`.
 *
 *   POST /auth/registrar   publica
 *   POST /auth/login       publica
 *   GET  /auth/eu          exige token
 */
import { Router } from "express";

import { entrar, eu, registrar } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/autenticacao";

export const authRoutes = Router();

authRoutes.post("/registrar", registrar);
authRoutes.post("/login", entrar);

// `autenticar` antes do controller: o token e conferido e `req.usuario`
// preenchido antes de `eu` rodar.
authRoutes.get("/eu", autenticar, eu);
