/**
 * Botao padrao do PRAZZO.
 *
 * Duas variantes:
 *   - "primary"   -> fundo roxo, texto branco (acao principal da tela)
 *   - "secondary" -> fundo branco com borda roxa (acao alternativa)
 *
 * O estado pressionado escurece o fundo (colors.primaryPressed): e o
 * equivalente nativo do `:hover` que o prototipo HTML usava.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius, shadow, spacing, textStyles } from "../theme";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  /** Texto exibido dentro do botao. */
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Bloqueia o toque e reduz a opacidade. */
  disabled?: boolean;
  /** Troca o texto por um spinner (util na ETAPA 4, durante as chamadas HTTP). */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isBlocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isPrimary && shadow.button,
        pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isBlocked && styles.blocked,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.textOnPrimary : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary ? styles.labelPrimary : styles.labelSecondary,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceTinted,
  },
  blocked: {
    opacity: 0.5,
  },
  label: {
    ...textStyles.button,
  },
  labelPrimary: {
    color: colors.textOnPrimary,
  },
  labelSecondary: {
    color: colors.primaryLight,
  },
});
