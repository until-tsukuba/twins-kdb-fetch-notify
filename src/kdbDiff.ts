import { diffJsonUrl } from "./envs.js";
import type { DiffJson } from "./types.js";

export const fetchDiffJson = async (url: string = diffJsonUrl): Promise<DiffJson> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`diff.jsonの取得に失敗しました: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as DiffJson;

    return data;
};
