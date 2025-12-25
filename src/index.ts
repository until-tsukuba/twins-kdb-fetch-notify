import { diffToDiscordMessage, sendDiscordWebhook } from "./discordWebhook.js";
import { fetchDiffJson } from "./kdbDiff.js";

const main = async (): Promise<void> => {
    const diff = await fetchDiffJson();
    const message = diffToDiscordMessage(diff);

    await sendDiscordWebhook(message);

    console.log(`差分件数: ${Object.keys(diff).length}`);
};

main().catch((error: unknown) => {
    if (error instanceof Error) {
        console.error(`実行エラー: ${error.message}`);
        return;
    }

    console.error("不明なエラーが発生しました。", error);
});
