/**
 * Area logada: a agenda de tarefas (rota "Dashboard").
 *
 * Estrutura, de cima para baixo:
 *   1. Header roxo com a marca, o titulo e o avatar (toque = sair)
 *   2. Faixa de calendario, segunda a sexta, com o dia selecionavel
 *   3. Lista das tarefas do dia escolhido
 *
 * ETAPA 3: as tarefas vem de `src/data/agenda.ts` (dados de exemplo).
 * >>> ETAPA 4 <<< trocar `buildAgendaWeek()` por uma chamada a
 * `src/services/`; o resto da tela nao muda, porque os tipos sao os mesmos.
 */
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskCard } from "../components";
import { buildAgendaWeek } from "../data/agenda";
import type { RootStackScreenProps } from "../navigation/types";
import { brand, colors, radius, spacing, textStyles } from "../theme";

/**
 * Usuario de exemplo da ETAPA 3.
 * >>> ETAPA 4 <<< isto sai: o nome vem do AuthContext, alimentado pelo login.
 */
const MOCK_USER = { initial: "A" };

export function DashboardScreen({
  navigation,
}: RootStackScreenProps<"Dashboard">) {
  const insets = useSafeAreaInsets();

  // `useMemo` para a semana ser montada uma vez, e nao a cada re-render
  // disparado pela troca de dia.
  const week = useMemo(() => buildAgendaWeek(), []);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const todayIndex = week.findIndex((day) => day.isToday);
    return todayIndex >= 0 ? todayIndex : 0;
  });

  const selectedDay = week[selectedIndex];

  function handleLogout() {
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }

  return (
    <View style={styles.container}>
      {/* O header e roxo escuro, entao os icones da barra de status
          precisam ser claros para continuarem legiveis. */}
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {/* Marca compacta: o "P" sozinho. A 22px ele continua legivel,
            enquanto o calendario completo da Welcome viraria um borrao. */}
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/logo-p.png")}
            style={styles.brandMark}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={`Logo do ${brand.name}`}
          />
          <Text style={styles.appTitle}>{brand.name}</Text>
        </View>

        <View style={styles.userRow}>
          <Text style={styles.greeting}>Agenda Academica</Text>

          <Pressable
            onPress={handleLogout}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <Text style={styles.avatarText}>{MOCK_USER.initial}</Text>
          </Pressable>
        </View>

        <View style={styles.calendar}>
          {week.map((day, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={day.id}
                onPress={() => setSelectedIndex(index)}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${day.fullName}, dia ${day.dayNumber}`}
              >
                <Text style={styles.dayName}>{day.shortName.toUpperCase()}</Text>
                <Text style={styles.dayNumber}>{day.dayNumber}</Text>

                {/* Bolinha so aparece nos dias que tem alguma tarefa. */}
                {day.tasks.length > 0 ? (
                  <View
                    style={[styles.dot, isSelected && styles.dotSelected]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.tasksContainer}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>
            Tarefas de {selectedDay.fullName}
          </Text>
          {/* TODO (ETAPA 4): abrir o formulario de nova tarefa.
              Hoje e so o rotulo, exatamente como no prototipo HTML. */}
          <Text style={styles.newTaskLabel}>+ Novo Prazzo</Text>
        </View>

        <FlatList
          data={selectedDay.tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum prazo para este dia</Text>
              <Text style={styles.emptyText}>Aproveite para descansar.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    // Indigo profundo, nao o `primaryDark` do tema claro: aquele roxo vivo
    // ocupando um quinto da tela brigava com o fundo quase preto e ainda
    // achatava o contraste do dia selecionado dentro do calendario.
    // Para voltar ao header roxo forte, troque por `colors.primaryDark`.
    backgroundColor: colors.surfaceTinted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  /** A arte tem proporcao 1.05 (1155x1213), mantida aqui. */
  brandMark: {
    width: 22,
    height: 23,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textOnPrimary,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },

  calendar: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  dayCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textOnPrimary,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.xs + 2,
  },
  dotSelected: {
    backgroundColor: colors.textOnPrimary,
  },
  /** Mantem a altura do card igual nos dias sem tarefa. */
  dotPlaceholder: {
    height: 5,
    marginTop: spacing.xs + 2,
  },

  tasksContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textHeading,
    flexShrink: 1,
  },
  newTaskLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryLight,
    marginLeft: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
