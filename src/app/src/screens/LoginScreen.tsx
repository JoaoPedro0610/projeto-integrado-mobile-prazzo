/**
 * Tela de login (rota "Login").
 *
 * ETAPA 3: a validacao e apenas de formato (campo vazio, tamanho minimo).
 * Nenhum RA/senha e conferido de verdade - qualquer par valido entra.
 *
 * >>> ETAPA 4 <<< trocar o corpo de `handleSubmit` por uma chamada a
 * `src/services/` (POST /sessions), guardar o token e so entao navegar.
 */
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input } from "../components";
import type { RootStackScreenProps } from "../navigation/types";
import { brand, colors, radius, shadow, spacing, textStyles } from "../theme";

/** Quantidade minima de digitos aceita no RA. */
const RA_MIN_LENGTH = 6;
/** Quantidade minima de caracteres aceita na senha. */
const PASSWORD_MIN_LENGTH = 6;

type FormErrors = {
  ra?: string;
  password?: string;
};

export function LoginScreen({ navigation }: RootStackScreenProps<"Login">) {
  const [ra, setRa] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  /** O RA e numerico: descarta qualquer caractere que nao seja digito. */
  function handleRaChange(value: string) {
    setRa(value.replace(/[^0-9]/g, ""));
  }

  function handleSubmit() {
    const nextErrors: FormErrors = {};

    if (ra.length === 0) {
      nextErrors.ra = "Informe o seu RA.";
    } else if (ra.length < RA_MIN_LENGTH) {
      nextErrors.ra = `O RA deve ter ao menos ${RA_MIN_LENGTH} digitos.`;
    }

    if (password.length === 0) {
      nextErrors.password = "Informe a sua senha.";
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // `reset` em vez de `navigate`: depois de entrar, o botao "voltar" do
    // Android nao pode devolver o usuario para a tela de login.
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require("../../assets/logo-mark.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel={`Logo do ${brand.name}`}
            />
            <Text style={styles.brand}>{brand.wordmark}</Text>
            <Text style={styles.tagline}>{brand.tagline}</Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Digite o seu RA"
              value={ra}
              onChangeText={handleRaChange}
              error={errors.ra}
              placeholder="Ex: 12345678"
              keyboardType="number-pad"
              maxLength={8}
              returnKeyType="next"
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Sua senha"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Button label="ENTRAR" onPress={handleSubmit} />
          </View>

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              Ainda nao tem conta? <Text style={styles.footerStrongText}>Criar conta</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  logo: {
    width: 76,
    height: 89,
    marginBottom: spacing.md,
  },
  brand: {
    ...textStyles.brand,
    letterSpacing: 0,
    color: colors.textHeading,
  },
  tagline: {
    ...textStyles.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  footerLink: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  footerStrongText: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
});
