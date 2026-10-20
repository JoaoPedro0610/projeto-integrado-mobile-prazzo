/**
 * Tela de cadastro (rota "Register").
 *
 * ETAPA 3: valida so o formato dos campos e entra direto no app.
 *
 * >>> ETAPA 4 <<< trocar o corpo de `handleSubmit` por uma chamada a
 * `src/services/` (POST /users). O backend e quem vai recusar um RA que
 * ja existe - a validacao daqui e apenas a primeira barreira, para o
 * usuario nao esperar uma ida ao servidor por um erro obvio.
 */
import { useState } from "react";
import {
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
import { colors, radius, shadow, spacing, textStyles } from "../theme";

const RA_MIN_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 6;
/** Checagem simples de e-mail: algo@algo.algo */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  name?: string;
  ra?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
};

export function RegisterScreen({
  navigation,
}: RootStackScreenProps<"Register">) {
  const [name, setName] = useState("");
  const [ra, setRa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit() {
    const nextErrors: FormErrors = {};

    if (name.trim().length < 3) {
      nextErrors.name = "Informe o seu nome completo.";
    }

    if (ra.length < RA_MIN_LENGTH) {
      nextErrors.ra = `O RA deve ter ao menos ${RA_MIN_LENGTH} digitos.`;
    }

    if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    if (passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = "As senhas nao conferem.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

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
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Comece a organizar os seus prazos academicos
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Nome completo"
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder="Ex: Maria Silva"
              autoCapitalize="words"
            />

            <Input
              label="RA"
              value={ra}
              onChangeText={(value) => setRa(value.replace(/[^0-9]/g, ""))}
              error={errors.ra}
              placeholder="Ex: 12345678"
              keyboardType="number-pad"
              maxLength={8}
            />

            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Minimo de 6 caracteres"
              secureTextEntry
            />

            <Input
              label="Confirmar senha"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              error={errors.passwordConfirmation}
              placeholder="Repita a senha"
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />

            <Button label="CRIAR CONTA" onPress={handleSubmit} />
          </View>

          {/* `navigate` e nao `goBack`: se o usuario chegou aqui pela Welcome,
              voltar levaria para a Welcome, e nao para o Login que o texto
              promete. Com `navigate`, o stack volta para o Login quando ele
              ja existe e o abre quando nao existe. */}
          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              Ja tem conta? <Text style={styles.footerStrongText}>Entrar</Text>
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
    marginBottom: spacing.xxl,
  },
  title: {
    ...textStyles.title,
    fontSize: 26,
    color: colors.textHeading,
  },
  subtitle: {
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
