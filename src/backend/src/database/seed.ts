/**
 * Popula o banco com os dados de exemplo.  Uso: `npm run seed`
 *
 * Reproduz o mock de `app/src/data/agenda.ts`, para o Dashboard continuar
 * mostrando a mesma semana depois de passar a ler da API.
 *
 * O mapeamento mock -> banco:
 *
 *   tag "Concluido" -> status 'concluida'    (e estado, nao categoria)
 *   tag "Urgente"   -> prioridade 'urgente'  (e prioridade, nao categoria)
 *   tag "Leitura"   -> tipo 'leitura'
 *   tag "Prova"     -> tipo 'prova'
 *   tag "Trabalho"  -> tipo 'trabalho'
 *   time "Ate 23:59"-> prazo = terca as 23:59 (instante, nao texto)
 *
 * E idempotente: apaga o usuario de exemplo e o recria. O ON DELETE CASCADE das
 * migrations leva embora disciplinas, tarefas e notificacoes dele, entao rodar
 * duas vezes nao duplica nada.
 */
import bcrypt from "bcryptjs";
import type { PoolClient } from "pg";

import { fecharPool, withTransaction } from "./pool";
import type { TarefaPrioridade, TarefaTipo } from "../types";

const RA_EXEMPLO = "12345678";
const SENHA_EXEMPLO = "prazzo123";

/**
 * Segunda-feira da semana atual. Copia deliberada do `mondayOfWeek` de
 * `app/src/data/agenda.ts`, inclusive o tratamento do domingo (aponta para a
 * segunda seguinte): as tarefas precisam cair na MESMA semana que o calendario
 * do app monta, senao o Dashboard abre vazio.
 */
function segundaDaSemana(referencia: Date): Date {
  const diaDaSemana = referencia.getDay();
  const deslocamento = diaDaSemana === 0 ? 1 : 1 - diaDaSemana;

  const segunda = new Date(referencia);
  segunda.setDate(referencia.getDate() + deslocamento);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

/**
 * Um instante da semana.
 *
 * `setHours` usa o fuso do computador que roda o seed, entao "23:59" e 23:59
 * na hora local de quem executou. O que vai para a coluna `timestamptz` e o
 * instante absoluto correspondente - o fuso do banco (TZ no docker-compose)
 * muda apenas como o psql exibe esse instante, nunca qual instante e.
 */
function instante(
  segunda: Date,
  diasDepoisDaSegunda: number,
  hora: number,
  minuto: number
): Date {
  const data = new Date(segunda);
  data.setDate(segunda.getDate() + diasDepoisDaSegunda);
  data.setHours(hora, minuto, 0, 0);
  return data;
}

type DisciplinaExemplo = { nome: string; codigo: string; cor: string };

/** Cores tiradas de `app/src/theme/colors.ts`, para a etiqueta bater com o tema. */
const DISCIPLINAS: DisciplinaExemplo[] = [
  { nome: "Banco de Dados II", codigo: "BD2", cor: "#6c5ce7" },
  { nome: "Engenharia de Software", codigo: "ESW", cor: "#00d2a0" },
  { nome: "Algoritmos", codigo: "ALG", cor: "#f87171" },
  { nome: "Redes de Computadores", codigo: "RED", cor: "#a29bfe" },
];

type TarefaExemplo = {
  titulo: string;
  disciplina: string | null;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  /** Dias apos a segunda: 0 = segunda ... 4 = sexta. */
  dia: number;
  hora: number;
  minuto: number;
  concluida: boolean;
};

const TAREFAS: TarefaExemplo[] = [
  // Segunda - era a tag "Concluido" do mock.
  {
    titulo: "Reuniao de grupo",
    disciplina: null,
    tipo: "outro",
    prioridade: "normal",
    dia: 0,
    hora: 14,
    minuto: 0,
    concluida: true,
  },
  // Terca - "Urgente" (prioridade) e "Leitura" (tipo).
  {
    titulo: "Entrega de BD II",
    disciplina: "Banco de Dados II",
    tipo: "entrega",
    prioridade: "urgente",
    dia: 1,
    hora: 23,
    minuto: 59,
    concluida: false,
  },
  {
    titulo: "Artigo de Engenharia de SW",
    disciplina: "Engenharia de Software",
    tipo: "leitura",
    prioridade: "normal",
    dia: 1,
    hora: 19,
    minuto: 0,
    concluida: false,
  },
  // Quarta - "Prova".
  {
    titulo: "Prova P1 de Algoritmos",
    disciplina: "Algoritmos",
    tipo: "prova",
    prioridade: "urgente",
    dia: 2,
    hora: 8,
    minuto: 0,
    concluida: false,
  },
  // Quinta fica vazia de proposito: e o dia do "Nenhum prazo para hoje" do app.
  // Sexta - "Trabalho".
  {
    titulo: "Apresentacao de Redes",
    disciplina: "Redes de Computadores",
    tipo: "trabalho",
    prioridade: "normal",
    dia: 4,
    hora: 20,
    minuto: 30,
    concluida: false,
  },
];

/** Antecedencias dos lembretes de cada tarefa pendente, em horas. */
const LEMBRETES_HORAS = [24, 1];

async function inserirUsuario(cliente: PoolClient): Promise<string> {
  const senhaHash = await bcrypt.hash(SENHA_EXEMPLO, 10);

  const { rows } = await cliente.query<{ id: string }>(
    `INSERT INTO usuarios (nome, ra, email, senha_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ["Maria Silva", RA_EXEMPLO, "maria.silva@exemplo.com", senhaHash]
  );

  const id = rows[0]?.id;
  if (!id) {
    throw new Error("INSERT em usuarios nao devolveu id.");
  }
  return id;
}

async function inserirDisciplinas(
  cliente: PoolClient,
  usuarioId: string
): Promise<Map<string, string>> {
  const porNome = new Map<string, string>();

  for (const disciplina of DISCIPLINAS) {
    const { rows } = await cliente.query<{ id: string }>(
      `INSERT INTO disciplinas (usuario_id, nome, codigo, cor)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [usuarioId, disciplina.nome, disciplina.codigo, disciplina.cor]
    );

    const id = rows[0]?.id;
    if (!id) {
      throw new Error(
        `INSERT em disciplinas nao devolveu id (${disciplina.nome}).`
      );
    }
    porNome.set(disciplina.nome, id);
  }

  return porNome;
}

export async function popularBanco(): Promise<void> {
  const segunda = segundaDaSemana(new Date());

  await withTransaction(async (cliente) => {
    // CASCADE limpa disciplinas, tarefas e notificacoes deste usuario.
    const apagados = await cliente.query(`DELETE FROM usuarios WHERE ra = $1`, [
      RA_EXEMPLO,
    ]);

    if (apagados.rowCount !== null && apagados.rowCount > 0) {
      console.log(
        `[seed] usuario de exemplo anterior removido (RA ${RA_EXEMPLO})`
      );
    }

    const usuarioId = await inserirUsuario(cliente);
    const disciplinas = await inserirDisciplinas(cliente, usuarioId);

    let notificacoes = 0;

    for (const tarefa of TAREFAS) {
      const prazo = instante(segunda, tarefa.dia, tarefa.hora, tarefa.minuto);

      const disciplinaId =
        tarefa.disciplina === null
          ? null
          : (disciplinas.get(tarefa.disciplina) ?? null);

      const { rows } = await cliente.query<{ id: string }>(
        `INSERT INTO tarefas
           (usuario_id, disciplina_id, titulo, tipo, prioridade, status, prazo, concluida_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          usuarioId,
          disciplinaId,
          tarefa.titulo,
          tarefa.tipo,
          tarefa.prioridade,
          tarefa.concluida ? "concluida" : "pendente",
          prazo,
          // A restricao `tarefa_conclusao_coerente` exige os dois juntos:
          // status 'concluida' com data, ou nenhum dos dois.
          tarefa.concluida ? prazo : null,
        ]
      );

      const tarefaId = rows[0]?.id;
      if (!tarefaId) {
        throw new Error(
          `INSERT em tarefas nao devolveu id (${tarefa.titulo}).`
        );
      }

      // Tarefa concluida nao precisa de lembrete.
      if (tarefa.concluida) {
        continue;
      }

      for (const horas of LEMBRETES_HORAS) {
        const agendadaPara = new Date(prazo.getTime() - horas * 60 * 60 * 1000);

        await cliente.query(
          `INSERT INTO notificacoes (tarefa_id, usuario_id, agendada_para)
           VALUES ($1, $2, $3)`,
          [tarefaId, usuarioId, agendadaPara]
        );
        notificacoes += 1;
      }
    }

    console.log(
      `[seed] ${DISCIPLINAS.length} disciplina(s), ${TAREFAS.length} tarefa(s) ` +
        `e ${notificacoes} notificacao(oes) criadas.`
    );
    console.log(
      `[seed] entre no app com RA ${RA_EXEMPLO} e senha ${SENHA_EXEMPLO}`
    );
  });
}

if (require.main === module) {
  popularBanco()
    .catch((erro: unknown) => {
      const mensagem = erro instanceof Error ? erro.message : String(erro);

      // Erro tipico de quem esqueceu o passo anterior. Vale a dica explicita.
      if (mensagem.includes("does not exist")) {
        console.error(
          "[seed] as tabelas nao existem. Rode `npm run migrate` primeiro."
        );
      } else {
        console.error("[seed] falhou:", mensagem);
      }

      process.exitCode = 1;
    })
    .finally(fecharPool);
}
