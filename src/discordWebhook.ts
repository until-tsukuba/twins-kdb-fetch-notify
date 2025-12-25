import { discordWebhookUrl } from "./envs.js";
import type { DiffEntry, DiffJson, DiffModifiedValue, DiffSubject, DiffType, Module, ModuleTimeTable, Terms, TimeTable } from "./types.js";

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

type DiffSubjectDisplayKey = Exclude<keyof DiffSubject, "raw">;

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

const fieldLabels: Record<DiffSubjectDisplayKey, string> = {
    name: "科目名",
    code: "科目番号",
    term: "学期",
    moduleTimeTable: "開講時期",
    instructors: "担当教員",
    affiliation: "所属",
    year: "標準履修年次",
};

const formatTerm = (term: Terms): string => `${term.text}(${term.code})`;

const moduleLabels: Record<Module, string> = {
    springA: "春A",
    springB: "春B",
    springC: "春C",
    summerVacation: "夏季休業",
    fallA: "秋A",
    fallB: "秋B",
    fallC: "秋C",
    springVacation: "春季休業",
};

const formatTimeTableSlot = (slot: TimeTable): string => {
    if (slot.period === null) {
        return `${slot.day} その他`;
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

type FormatterMap = { [K in DiffSubjectDisplayKey]: (value: DiffSubject[K]) => string };

const valueFormatters: FormatterMap = {
    name: (value) => value,
    code: (value) => value,
    term: (value) => formatTerm(value),
    moduleTimeTable: (value) => formatModuleTimeTable(value),
    instructors: (value) => (value.length > 0 ? value.join(", ") : "なし"),
    affiliation: (value) => `${value.name}(${value.code})`,
    year: (value) => (value.length > 0 ? value.join(", ") : "なし"),
};

const isDiffSubjectKey = (key: string): key is DiffSubjectDisplayKey => key in valueFormatters;

const formatValue = <K extends DiffSubjectDisplayKey>(key: K, value: DiffSubject[K]): string => valueFormatters[key](value);

const buildModifiedFields = (diff: DiffModifiedValue): DiscordEmbedField[] => {
    const fields: DiscordEmbedField[] = [];

    const diffKeys = Object.keys(diff).filter(isDiffSubjectKey);

    for (const key of diffKeys) {
        const value = diff[key];
        if (!value) {
            continue;
        }

        fields.push({
            name: fieldLabels[key],
            value: `${formatValue(key, value.from)} → ${formatValue(key, value.to)}`,
        });
    }

    return fields;
};

const inlineFieldKeys = new Set<DiffSubjectDisplayKey>(["code", "term", "affiliation", "year"]);

const buildAllFields = (subject: DiffSubject): DiscordEmbedField[] => {
    const fields: DiscordEmbedField[] = [];

    const subjectKeys = Object.keys(subject).filter(isDiffSubjectKey);

    for (const key of subjectKeys) {
        fields.push({
            name: fieldLabels[key],
            value: formatValue(key, subject[key]),
            ...(inlineFieldKeys.has(key) ? { inline: true } : {}),
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
