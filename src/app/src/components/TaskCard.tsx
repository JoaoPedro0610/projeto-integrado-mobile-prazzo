/**
 * Card de uma tarefa na agenda.
 *
 * Equivale ao `.task-card` do prototipo: etiqueta, titulo e horario
 * empilhados dentro de um cartao branco com borda suave.
 */
import { StyleSheet, Text, View } from "react-native";

import { Tag } from "./Tag";
import type { Task } from "../data/agenda";
import { colors, radius, spacing, textStyles } from "../theme";

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <View style={styles.card}>
      <Tag label={task.tag} priority={task.priority} />
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.time}>{`\u23F0  ${task.time}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  time: {
    ...textStyles.subtitle,
    fontSize: 11,
    fontWeight: "400",
    color: colors.textSecondary,
  },
});
