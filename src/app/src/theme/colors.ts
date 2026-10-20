/**
 * Paleta oficial do PRAZZO - TEMA ESCURO.
 *
 * A identidade roxo/verde-agua veio do prototipo HTML e da logo, mas os
 * fundos e textos foram invertidos para o tema escuro:
 *   - fundos vao do quase-preto azulado (#0f1117) ao cinza-azulado (#191d2a)
 *   - textos vao do quase-branco (#f3f4f8) ao cinza medio (#8b91a6)
 *
 * As CHAVES sao as mesmas do tema claro. Isso e proposital: para voltar ao
 * claro, ou para oferecer os dois temas depois, basta trocar os valores
 * deste arquivo - nenhuma tela precisa mudar.
 *
 * Regra que continua valendo: sempre importe daqui, nunca escreva um
 * "#6c5ce7" solto no meio de uma tela.
 */
export const colors = {
  /** Roxo principal - fundo de botoes e destaques solidos. */
  primary: "#6c5ce7",
  /** Roxo escuro - header do dashboard. E o mesmo indigo da logo. */
  primaryDark: "#4834d4",
  /**
   * Lilas - AGORA e a cor dos textos e icones de destaque.
   * No tema claro esse papel era do `primary`, que sobre fundo escuro
   * nao tem contraste suficiente para texto.
   */
  primaryLight: "#a29bfe",
  /** Roxo do estado pressionado do botao principal. */
  primaryPressed: "#5b4bc4",

  /** Verde-agua dos detalhes (status positivo, confirmacoes). */
  accent: "#00d2a0",

  /** Fundos - do mais escuro (tela) ao mais claro (cartao). */
  background: "#0f1117",
  backgroundAlt: "#151824",
  surface: "#191d2a",
  /** Fundo das tags neutras: roxo bem dessaturado, nao mais lilas claro. */
  surfaceTinted: "#241f42",

  /** Textos */
  textPrimary: "#e6e8f0",
  textHeading: "#f3f4f8",
  textSecondary: "#8b91a6",
  textLabel: "#c2c7d6",
  textOnPrimary: "#ffffff",

  /** Bordas - sutis, so o suficiente para separar cartao do fundo. */
  border: "#262a38",
  borderInput: "#363c4e",

  /** Estados - vermelho clareado, porque o #dc2626 some no escuro. */
  danger: "#f87171",
  dangerSurface: "#3a1e1e",
  success: "#00d2a0",

  /** Utilitarios */
  white: "#ffffff",
  black: "#0b0d12",
  transparent: "transparent",
} as const;

export type AppColor = keyof typeof colors;
