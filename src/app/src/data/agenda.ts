/**
 * Dados de exemplo da agenda (ETAPA 3).
 *
 * O app ainda nao conversa com a API. Estas tarefas existem apenas para as
 * telas terem conteudo real para exibir na apresentacao da ETAPA 3.
 *
 * >>> Na ETAPA 4 este arquivo sai. <<<
 * As tarefas passam a vir de `src/services/`, mas mantendo EXATAMENTE os
 * tipos declarados aqui (`Task`, `AgendaDay`) - assim nenhuma tela precisa
 * mudar. E a mesma ideia dos `repositories/` do backend.
 */

/** Define a cor da etiqueta no card da tarefa. */
export type TaskPriority = "urgent" | "normal";

export type Task = {
  id: string;
  /** Etiqueta curta exibida no topo do card ("Urgente", "Leitura", "Prova"). */
  tag: string;
  priority: TaskPriority;
  title: string;
  /** Texto livre do horario ("Ate 23:59", "As 19:00"). */
  time: string;
};

export type AgendaDay = {
  id: string;
  /** Abreviacao no calendario ("Seg", "Ter"...). */
  shortName: string;
  /** Nome completo no titulo da lista ("Terca-feira"). */
  fullName: string;
  dayNumber: number;
  /** Marca o dia atual para o calendario ja abrir selecionado nele. */
  isToday: boolean;
  tasks: Task[];
};

const WEEKDAYS = [
  { short: "Seg", full: "Segunda-feira" },
  { short: "Ter", full: "Terca-feira" },
  { short: "Qua", full: "Quarta-feira" },
  { short: "Qui", full: "Quinta-feira" },
  { short: "Sex", full: "Sexta-feira" },
] as const;

/** Tarefas de exemplo por dia util (0 = segunda ... 4 = sexta). */
const TASKS_BY_WEEKDAY: Task[][] = [
  [
    {
      id: "t1",
      tag: "Concluido",
      priority: "normal",
      title: "Reuniao de grupo",
      time: "Realizado as 14:00",
    },
  ],
  [
    {
      id: "t2",
      tag: "Urgente",
      priority: "urgent",
      title: "Entrega de BD II",
      time: "Ate 23:59",
    },
    {
      id: "t3",
      tag: "Leitura",
      priority: "normal",
      title: "Artigo de Engenharia de SW",
      time: "As 19:00",
    },
  ],
  [
    {
      id: "t4",
      tag: "Prova",
      priority: "urgent",
      title: "Prova P1 de Algoritmos",
      time: "As 08:00",
    },
  ],
  [],
  [
    {
      id: "t5",
      tag: "Trabalho",
      priority: "normal",
      title: "Apresentacao de Redes",
      time: "As 20:30",
    },
  ],
];

/**
 * Segunda-feira da semana da data informada.
 * `getDay()` devolve 0 no domingo, entao no domingo apontamos para a
 * segunda seguinte (a semana que o aluno tem pela frente).
 */
function mondayOfWeek(reference: Date): Date {
  const weekday = reference.getDay();
  const offset = weekday === 0 ? 1 : 1 - weekday;

  const monday = new Date(reference);
  monday.setDate(reference.getDate() + offset);
  return monday;
}

/**
 * Monta a semana (segunda a sexta) em torno da data atual, para o
 * calendario nunca aparecer com datas velhas na apresentacao.
 */
export function buildAgendaWeek(reference: Date = new Date()): AgendaDay[] {
  const monday = mondayOfWeek(reference);

  return WEEKDAYS.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      id: weekday.short,
      shortName: weekday.short,
      fullName: weekday.full,
      dayNumber: date.getDate(),
      isToday: date.toDateString() === reference.toDateString(),
      tasks: TASKS_BY_WEEKDAY[index] ?? [],
    };
  });
}
