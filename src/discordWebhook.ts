import { discordWebhookUrl } from "./envs.js";
import type { DiffJson } from "./kdbDiff.js";

type DiscordEmbedField = {
    name: string;
    value: string;
    inline?: boolean;
};

type DiscordEmbed = {
    title: string;
    description?: string;
    color?: number;
    fields?: DiscordEmbedField[];
};

type DiscordWebhookMessage = {
    content?: string;
    embeds?: DiscordEmbed[];
};

type DiffType = "added" | "modified" | "removed";

type Terms = { text: "春学期"; code: "A" } | { text: "秋学期"; code: "B" };

type DaysOfWeek = "月" | "火" | "水" | "木" | "金" | "土" | "日" | "他";

type Periods = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type TimeTable = {
    day: DaysOfWeek;
    period: Periods | null;
};

type Module = "springA" | "springB" | "springC" | "summerVacation" | "fallA" | "fallB" | "fallC" | "springVacation";

type ModuleTimeTable = Record<Module, TimeTable[]>;

type Affiliation = {
    name: string;
    code: string;
};

type DiffSubject = {
    name: string;
    code: string;
    term: Terms;
    moduleTimeTable: ModuleTimeTable;
    instructors: string[];
    affiliation: Affiliation;
    year: number[];
};

type DiffModifiedValue = {
    [K in keyof DiffSubject]?: { from: DiffSubject[K]; to: DiffSubject[K] };
};

type DiffEntry =
    | {
          type: "added" | "removed";
          value: DiffSubject;
      }
    | {
          type: "modified";
          value: DiffSubject;
          diff: DiffModifiedValue;
      };

const typeLabels: Record<DiffType, string> = {
    added: "追加",
    modified: "変更",
    removed: "削除",
};

const typeColors: Record<DiffType, number> = {
    added: 0x2ecc71,
    modified: 0xf1c40f,
    removed: 0xe74c3c,
};

const fieldLabels: Record<keyof DiffSubject, string> = {
    name: "科目名",
    code: "科目コード",
    term: "学期",
    moduleTimeTable: "開講時期",
    instructors: "担当教員",
    affiliation: "所属",
    year: "対象年次",
};

const formatTerm = (term: Terms): string => `${term.text}(${term.code})`;

const moduleLabels: Record<Module, string> = {
    springA: "春A",
    springB: "春B",
    springC: "春C",
    summerVacation: "夏休み",
    fallA: "秋A",
    fallB: "秋B",
    fallC: "秋C",
    springVacation: "春休み",
};

const formatTimeTableSlot = (slot: TimeTable): string => {
    if (slot.period === null) {
        return `${slot.day} 随時`;
    }

    return `${slot.day}${slot.period}`;
};

const formatModuleTimeTable = (moduleTimeTable: ModuleTimeTable): string => {
    const lines = Object.entries(moduleTimeTable).map(([moduleKey, slots]) => {
        const label = moduleLabels[moduleKey as Module];
        if (slots.length === 0) {
            return `${label}: なし`;
        }

        return `${label}: ${slots.map(formatTimeTableSlot).join(", ")}`;
    });

    return lines.join("\n");
};

type FormatterMap = { [K in keyof DiffSubject]: (value: DiffSubject[K]) => string };

const valueFormatters: FormatterMap = {
    name: (value) => value,
    code: (value) => value,
    term: (value) => formatTerm(value),
    moduleTimeTable: (value) => formatModuleTimeTable(value),
    instructors: (value) => (value.length > 0 ? value.join(", ") : "なし"),
    affiliation: (value) => `${value.name}(${value.code})`,
    year: (value) => (value.length > 0 ? value.join(", ") : "なし"),
};

const isDiffSubjectKey = (key: string): key is keyof DiffSubject => key in valueFormatters;

const buildModifiedFields = (diff: DiffModifiedValue): DiscordEmbedField[] => {
    const fields: DiscordEmbedField[] = [];

    for (const [key, value] of Object.entries(diff)) {
        if (!isDiffSubjectKey(key) || !value) {
            continue;
        }

        const formatter = valueFormatters[key];
        fields.push({
            name: fieldLabels[key],
            value: `${formatter(value.from)} → ${formatter(value.to)}`,
        });
    }

    return fields;
};

const inlineFieldKeys = new Set<keyof DiffSubject>(["code", "term", "affiliation", "year"]);

const buildAllFields = (subject: DiffSubject): DiscordEmbedField[] => {
    const fields: DiscordEmbedField[] = [];

    for (const key of Object.keys(subject)) {
        if (!isDiffSubjectKey(key)) {
            continue;
        }

        const formatter = valueFormatters[key];
        fields.push({
            name: fieldLabels[key],
            value: formatter(subject[key]),
            inline: inlineFieldKeys.has(key) ? true : undefined,
        });
    }

    return fields;
};

const diffEntryToEmbed = (entry: DiffEntry): DiscordEmbed => {
    const subject = entry.value;
    const fields = entry.type === "modified" ? buildModifiedFields(entry.diff) : buildAllFields(subject);

    return {
        title: `${typeLabels[entry.type]}: ${subject.name} (${subject.code})`,
        color: typeColors[entry.type],
        fields,
    };
};

export const diffToDiscordMessage = (diff: DiffJson): DiscordWebhookMessage => {
    const embeds = Object.values(diff).map((entry) => diffEntryToEmbed(entry));

    if (embeds.length === 0) {
        return { content: "差分はありませんでした。" };
    }

    return { embeds };
};

export const sendDiscordWebhook = async (message: DiscordWebhookMessage, url: string = discordWebhookUrl): Promise<void> => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });

    if (!response.ok) {
        throw new Error(`Webhook送信に失敗しました: ${response.status} ${response.statusText}`);
    }
};
