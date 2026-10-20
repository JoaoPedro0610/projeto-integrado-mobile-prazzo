/**
 * Tipografia do PRAZZO.
 *
 * O prototipo usa a fonte do sistema (system-ui / Segoe UI / Roboto).
 * No React Native isso e o padrao quando NAO definimos `fontFamily`,
 * entao aqui centralizamos apenas tamanhos e pesos.
 */
import type { TextStyle } from "react-native";

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
  display: 34,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  black: "900",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

/** Estilos de texto prontos, para reaproveitar entre as telas. */
export const textStyles = {
  /** "PRAZZO" na tela inicial. */
  brand: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    letterSpacing: 2,
  },
  /** Titulo de secao/tela. */
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  /** Subtitulo / slogan. */
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  /** Rotulo de campo de formulario. */
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  /** Texto corrido. */
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
  /** Texto do botao principal. */
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
} as const satisfies Record<string, TextStyle>;
