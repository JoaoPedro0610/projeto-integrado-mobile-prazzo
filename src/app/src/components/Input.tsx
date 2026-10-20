/**
 * Campo de formulario do PRAZZO: rotulo + caixa de texto + erro.
 *
 * Reproduz o `.form-group` do prototipo, incluindo o realce roxo quando o
 * campo esta em foco (no HTML era `input:focus { border-color: #6c5ce7 }`).
 *
 * Como herda as props do TextInput, qualquer opcao nativa continua valendo:
 *   <Input label="Senha" secureTextEntry ... />
 *   <Input label="RA" keyboardType="number-pad" maxLength={8} ... />
 */
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, radius, spacing, textStyles } from "../theme";

type InputProps = {
  /** Rotulo exibido acima do campo. */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Mensagem de validacao. Quando presente, a borda fica vermelha. */
  error?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "style">;

export function Input({
  label,
  value,
  onChangeText,
  error,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          focused && styles.inputFocused,
          hasError && styles.inputError,
        ]}
        {...textInputProps}
      />

      {/* Reserva a linha do erro so quando ele existe, para o formulario
          nao "pular" enquanto o usuario digita. */}
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.label,
    color: colors.textLabel,
    marginBottom: spacing.xs + 2,
  },
  input: {
    height: 50,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    marginTop: spacing.xs + 2,
  },
});
