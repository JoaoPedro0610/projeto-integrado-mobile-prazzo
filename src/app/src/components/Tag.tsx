/**
 * Etiqueta colorida exibida no topo de cada tarefa.
 *
 * Mapeia as classes `.tag-urgent` / `.tag-normal` do prototipo:
 *   urgent -> fundo vermelho claro, texto vermelho
 *   normal -> fundo lilas claro, texto roxo
 */
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";
import type { TaskPriority } from "../data/agenda";

type TagProps = {
  label: string;
  priority: TaskPriority;
};

export function Tag({ label, priority }: TagProps) {
  const isUrgent = priority === "urgent";

  return (
    <View style={[styles.tag, isUrgent ? styles.urgent : styles.normal]}>
      <Text
        style={[styles.text, isUrgent ? styles.textUrgent : styles.textNormal]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  urgent: {
    backgroundColor: colors.dangerSurface,
  },
  normal: {
    backgroundColor: colors.surfaceTinted,
  },
  text: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textUrgent: {
    color: colors.danger,
  },
  textNormal: {
    color: colors.primaryLight,
  },
});
