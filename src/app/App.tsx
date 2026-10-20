/**
 * PRAZZO - componente raiz do app.
 *
 * Responsabilidades: providers globais (safe area, e futuramente o
 * AuthContext da ETAPA 4) e o navegador raiz. A regra e manter este
 * arquivo enxuto: tela nenhuma mora aqui.
 */
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Fundo escuro em todo o app -> icones claros na barra de status. */}
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
