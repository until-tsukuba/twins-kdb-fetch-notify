import { diffJsonUrl, discordWebhookUrl } from "./envs.js";
import { prioritizeDiffEntries } from "./diffUtils.js";
import { fieldLabels, formatValue, isDiffSubjectKey, typeLabels } from "./labels.js";
import type { DiffEntry, DiffJson, DiffModifiedValue, DiffType, MergedSubject } from "./types.js";

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

const typeColors: Record<DiffType, number> = {
    added: 0x2ecc71,
    modified: 0xf1c40f,
    removed: 0xe74c3c,
};

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
    const entries = prioritizeDiffEntries(Object.values(diff));

    if (entries.length === 0) {
        return { content: "差分はありませんでした。" };
    }

    const embeds = entries.map((entry) => diffEntryToEmbed(entry));

    if (embeds.length > 10) {
        return {
            content: `差分件数が${embeds.length}件です。続きは ${diffJsonUrl} をご覧ください。`,
            embeds: embeds.slice(0, 10),
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
