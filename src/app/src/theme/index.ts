/**
 * Ponto unico de importacao do tema:
 *   import { colors, spacing, textStyles } from "../theme";
 */
export { colors, type AppColor } from "./colors";
export { fontSize, fontWeight, textStyles } from "./typography";
export { spacing, radius, shadow } from "./metrics";

/** Dados de marca usados na tela inicial e no header. */
export const brand = {
  /** Caixa alta: usado no rotulo pequeno do header do dashboard. */
  name: "PRAZZO",
  /** Caixa mista: e assim que a logo escreve a marca. */
  wordmark: "Prazzo",
  slogan: "Organize. Planeje. Cumpra.",
  tagline: "Gestao de tarefas e prazos academicos",
} as const;
