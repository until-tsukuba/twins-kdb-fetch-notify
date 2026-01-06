import { teamsWebhookUrl } from "./envs.js";
import type { DiffJson } from "./types.js";

const escapeHtml = (raw: string): string => {
    return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

export const diffToTeamsMessage = (diff: DiffJson): string => {
    return `<p class="editor-paragraph">${escapeHtml(JSON.stringify(diff))}</p>`;
};

export const sendTeamsWebhook = async (message: string): Promise<void> => {
    const response = await fetch(teamsWebhookUrl, {
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
