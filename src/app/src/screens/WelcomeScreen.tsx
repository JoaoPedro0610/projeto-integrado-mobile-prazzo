/**
 * Tela inicial do PRAZZO (rota "Welcome").
 *
 * Primeira coisa que o usuario ve: a marca e as duas portas de entrada
 * do app. Nao tem regra de negocio nenhuma aqui - so navegacao.
 */
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components";
import type { RootStackScreenProps } from "../navigation/types";
import { brand, colors, spacing, textStyles } from "../theme";

/**
 * A arte tem 442x518, entao a altura e ~1.17x a largura. Fixamos as duas
 * para o layout nao "pular" enquanto a imagem carrega.
 */
const LOGO_WIDTH = 148;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (518 / 442));

export function WelcomeScreen({ navigation }: RootStackScreenProps<"Welcome">) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/logo-mark.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={`Logo do ${brand.name}`}
        />

        <Text style={styles.wordmark}>{brand.wordmark}</Text>
        <Text style={styles.slogan}>{brand.slogan}</Text>
        <Text style={styles.tagline}>{brand.tagline}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="ENTRAR" onPress={() => navigation.navigate("Login")} />
        <Button
          label="CRIAR CONTA"
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    marginBottom: spacing.xl,
  },
  wordmark: {
    ...textStyles.brand,
    letterSpacing: 0,
    color: colors.textHeading,
  },
  slogan: {
    ...textStyles.subtitle,
    color: colors.primaryLight,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  tagline: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  actions: {
    padding: spacing.xxl,
    gap: spacing.md,
  },
});
