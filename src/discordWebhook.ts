import { discordWebhookUrl } from "./envs.js";
import type { DiffEntry, DiffJson, DiffModifiedValue, DiffType, MergedSubject, Module, ModuleTimeTable, Terms, TimeTable } from "./types.js";

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

const fieldLabels: Record<keyof MergedSubject, string> = {
    code: "科目番号",
    name: "科目名",
    syllabusLatestLink: "シラバス",
    instructionalType: "授業方法",
    credits: "単位数",
    year: "標準履修年次",
    terms: "開講時期",
    classroom: "教室",
    instructor: "担当教員",
    overview: "授業概要",
    remarks: "備考",
    auditor: "科目等履修生申請可否",
    conditionsForAuditors: "申請条件",
    exchangeStudent: "交換留学生",
    conditionsForExchangeStudents: "交換留学生条件",
    JaEnCourseName: "英語名称",
    parentNumber: "親科目番号",
    parentCourseName: "親科目名",
    affiliation: "所属",
    requisite: "関連科目",
    kdbDataUpdateDate: "KDB更新日",
};

const formatTerm = (term: Terms | null): string => (term ? `${term.text}(${term.code})` : "なし");

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

const formatModuleTimeTable = (moduleTimeTable: ModuleTimeTable | null): string => {
    if (!moduleTimeTable) {
        return "なし";
    }

    const lines = Object.entries(moduleTimeTable).map(([moduleKey, slots]) => {
        const label = moduleLabels[moduleKey as Module];
        if (slots.length === 0) {
            return `${label}: なし`;
        }

        return `${label}: ${slots.map(formatTimeTableSlot).join(", ")}`;
    });

    return lines.join("\n");
};

type FormatterMap = { [K in keyof MergedSubject]: (value: MergedSubject[K] | null) => string };

const valueFormatters: FormatterMap = {
    name: (value) => value ?? "なし",
    code: (value) => value ?? "なし",
    syllabusLatestLink: (value) => value ?? "なし",
    instructionalType: (value) => value?.value?.text ?? "なし",
    credits: (value) => {
        const credit = value?.value;
        if (!credit) {
            return "なし";
        }
        if (credit.type === "normal") {
            return `${credit.value}`;
        }
        return credit.type === "none" ? "なし" : "不明";
    },
    year: (value) => {
        if (!value?.value) {
            return "なし";
        }
        return value.value.type === "normal" ? value.value.value.join(", ") : "不明";
    },
    terms: (value) => {
        if (!value) {
            return "なし";
        }
        const lines = [`学期: ${formatTerm(value.term)}`, value.module ? `実施学期: ${value.module}` : "実施学期: なし", value.weekdayAndPeriod ? `曜時限: ${value.weekdayAndPeriod}` : "曜時限: なし"];
        if (value.moduleTimeTable) {
            lines.push(`モジュール: \n${formatModuleTimeTable(value.moduleTimeTable)}`);
        }
        return lines.join("\n");
    },
    classroom: (value) => value ?? "なし",
    instructor: (value) => (value?.value && value.value.length > 0 ? value.value.join(", ") : "なし"),
    overview: (value) => value ?? "なし",
    remarks: (value) => value ?? "なし",
    auditor: (value) => value ?? "なし",
    conditionsForAuditors: (value) => value ?? "なし",
    exchangeStudent: (value) => value ?? "なし",
    conditionsForExchangeStudents: (value) => value ?? "なし",
    JaEnCourseName: (value) => value ?? "なし",
    parentNumber: (value) => value ?? "なし",
    parentCourseName: (value) => value ?? "なし",
    affiliation: (value) => (value ? `${value.name ?? "不明"}(${value.code ?? "不明"})` : "なし"),
    requisite: (value) => (value && value.length > 0 ? value.map((item) => item.name).join(", ") : "なし"),
    kdbDataUpdateDate: (value) => value ?? "なし",
};

const isDiffSubjectKey = (key: string): key is keyof MergedSubject => key in valueFormatters;

const formatValue = <K extends keyof MergedSubject>(key: K, value: MergedSubject[K]): string => valueFormatters[key](value);

const inlineFieldKeys = new Set<keyof MergedSubject>(["code", "credits", "year", "affiliation"]);

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

const buildAllFields = (subject: MergedSubject): DiscordEmbedField[] => {
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
        title: `${typeLabels[entry.type]}: ${subject.name ?? "科目名不明"} (${subject.code ?? "科目番号不明"})`,
        color: typeColors[entry.type],
        fields,
    };
};

export const diffToDiscordMessage = (diff: DiffJson): DiscordWebhookMessage => {
    const embeds = Object.values(diff).map((entry) => diffEntryToEmbed(entry));

    if (embeds.length === 0) {
        return {
            content: "差分はありませんでしたなのです！",
        };
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
