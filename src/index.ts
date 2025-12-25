import { diffToDiscordMessage, sendDiscordWebhook } from "./discordWebhook.js";
import { fetchDiffJson } from "./kdbDiff.js";

const main = async (): Promise<void> => {
    const diff = await fetchDiffJson();
    const message = diffToDiscordMessage(diff);

    await sendDiscordWebhook(message);

    console.log(`差分件数: ${Object.keys(diff).length}`);
};

main();
