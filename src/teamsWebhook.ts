import { prioritizeDiffEntries } from "./diffUtils.js";
import { diffJsonUrl, teamsWebhookUrl } from "./envs.js";
import { fieldLabels, formatValue, isDiffSubjectKey, typeLabels } from "./labels.js";
import type { DiffEntry, DiffJson, DiffModifiedValue, MergedSubject } from "./types.js";

const escapeHtml = (raw: string): string => raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const formatHtmlValue = (value: string): string => escapeHtml(value).replace(/\n/g, "<br />");

const buildModifiedFields = (diff: DiffModifiedValue): string => {
    const diffKeys = Object.keys(diff).filter(isDiffSubjectKey);
    const items = diffKeys.flatMap((key) => {
        const value = diff[key];
        if (!value) {
            return [];
        }

        const content = `${formatHtmlValue(formatValue(key, value.from))} → ${formatHtmlValue(formatValue(key, value.to))}`;
        return `<strong>${escapeHtml(fieldLabels[key])}</strong>: ${content}`;
    });

    return items.join("<br />");
};

const buildAllFields = (subject: MergedSubject): string => {
    const subjectKeys = Object.keys(subject).filter(isDiffSubjectKey);
    const items = subjectKeys.map((key) => `<strong>${escapeHtml(fieldLabels[key])}</strong>: ${formatHtmlValue(formatValue(key, subject[key]))}`);

    return items.join("<br />");
};

const diffEntryToHtml = (entry: DiffEntry): string => {
    const subject = entry.value;
    const fieldsHtml = entry.type === "modified" ? buildModifiedFields(entry.diff) : buildAllFields(subject);
    const title = `${typeLabels[entry.type]}: ${subject.name ?? "科目名不明"} (${subject.code ?? "科目番号不明"})`;

    return `<strong>${escapeHtml(title)}</strong><br />${fieldsHtml}`;
};

export const diffToTeamsMessage = (diff: DiffJson): string => {
    const entries = prioritizeDiffEntries(Object.values(diff));
    if (entries.length === 0) {
        return "<p>差分はありませんでした。</p>";
    }

    const displayEntries = entries.slice(0, 10);
    const notice = entries.length > 10 ? `差分件数が${entries.length}件です。続きは <a href="${escapeHtml(diffJsonUrl)}">${escapeHtml(diffJsonUrl)}</a> をご覧ください。<br />` : "";

    const body = displayEntries.map((entry) => diffEntryToHtml(entry)).join("<br /><br />");

    return `<p>${notice}${body}</p>`;
};

export const sendTeamsWebhook = async (message: string): Promise<void> => {
    const response = await fetch(teamsWebhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            attachments: [],
            custom_html: message,
        }),
    });

    if (!response.ok) {
        throw new Error(`Webhook送信に失敗しました: ${response.status} ${response.statusText}`);
    }
};
