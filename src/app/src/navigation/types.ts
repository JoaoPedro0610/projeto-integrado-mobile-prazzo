/**
 * Contrato de navegacao do PRAZZO.
 *
 * Aqui ficam declaradas TODAS as rotas do app e os parametros que cada uma
 * recebe (`undefined` = a rota nao recebe parametro). Como o TypeScript le
 * este arquivo, `navigation.navigate("Login")` passa a ter autocomplete e
 * um erro de compilacao se alguem digitar um nome de rota que nao existe.
 *
 * ETAPA 3: as quatro telas estao implementadas em `src/screens/`.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  /** Tela inicial: logo, slogan e botoes "Entrar" / "Criar conta". */
  Welcome: undefined;
  /** Autenticacao por RA + senha. */
  Login: undefined;
  /** Cadastro de novo usuario. */
  Register: undefined;
  /** Area logada (agenda de tarefas). */
  Dashboard: undefined;
};

/**
 * Atalho para tipar as props de uma tela:
 *   function LoginScreen({ navigation }: RootStackScreenProps<"Login">) { ... }
 */
export type RootStackScreenProps<TRoute extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, TRoute>;

/**
 * Torna as rotas conhecidas pelo hook `useNavigation()` sem precisar
 * passar o tipo manualmente em cada chamada.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
