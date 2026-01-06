import { diffToDiscordMessage, sendDiscordWebhook } from "./discordWebhook.js";
import { fetchDiffJson } from "./kdbDiff.js";
import { diffToTeamsMessage, sendTeamsWebhook } from "./teamsWebhook.js";

const main = async (): Promise<void> => {
    const diff = await fetchDiffJson();
    const message = diffToDiscordMessage(diff);
    const teamsMessage = diffToTeamsMessage(diff);

    await Promise.all([sendDiscordWebhook(message), sendTeamsWebhook(teamsMessage)]);

    console.log(`差分件数: ${Object.keys(diff).length}`);
};

main();
