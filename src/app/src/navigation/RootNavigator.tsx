/**
 * Navegador raiz do PRAZZO (React Navigation - native stack).
 *
 * Fluxo das telas:
 *
 *   Welcome ──"ENTRAR"───────> Login ────┐
 *      │                         ^       │ reset
 *      └──"CRIAR CONTA"─> Register ┘     v
 *                            │       Dashboard
 *                            └─reset────┘
 *
 * Login e Register usam `navigation.reset` (e nao `navigate`) ao entrar no
 * Dashboard: assim o botao "voltar" do Android nao devolve o usuario para
 * a tela de autenticacao depois de ele ja estar logado. O mesmo vale para
 * o logout, que reseta de volta para a Welcome.
 */
import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
  DashboardScreen,
  LoginScreen,
  RegisterScreen,
  WelcomeScreen,
} from "../screens";
import { colors } from "../theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Aplica a paleta do PRAZZO nos elementos padrao do React Navigation.
 * A base e o `DarkTheme`: sem isso o fundo padrao do navegador continua
 * branco e pisca a cada transicao de tela.
 */
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.primaryDark,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          // As telas do PRAZZO desenham o proprio cabecalho, entao o header
          // padrao fica desligado.
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
