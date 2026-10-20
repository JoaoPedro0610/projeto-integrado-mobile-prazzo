/**
 * Espacamentos, raios de borda e sombras.
 * Mesmos valores do prototipo, para o app nativo "parecer" o mockup.
 */
import { Platform, type ViewStyle } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/**
 * Sombra multiplataforma: no iOS usa shadow*, no Android usa elevation.
 * (No prototipo era `box-shadow`, que nao existe no React Native.)
 */
export const shadow: Record<"card" | "button", ViewStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: "#6c5ce7",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    default: { elevation: 3 },
  }) as ViewStyle,

  button: Platform.select({
    ios: {
      shadowColor: "#6c5ce7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    default: { elevation: 4 },
  }) as ViewStyle,
};
