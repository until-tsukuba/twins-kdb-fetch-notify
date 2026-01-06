import "dotenv/config";

const requireEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`環境変数${key}が設定されていません。`);
    }

    return value;
};

export const diffJsonUrl = requireEnv("DIFF_JSON_URL");
export const discordWebhookUrl = requireEnv("DISCORD_WEBHOOK_URL");
export const teamsWebhookUrl = requireEnv("TEAMS_WEBHOOK_URL");
