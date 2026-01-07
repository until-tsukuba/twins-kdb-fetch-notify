import { isDiffSubjectKey } from "./labels.js";
import type { DiffEntry, MergedSubject } from "./types.js";

const modifiedPriorityOrder: Array<keyof MergedSubject> = ["kdbDataUpdateDate", "instructor"];

const getEntryPriority = (entry: DiffEntry): number => {
    if (entry.type !== "modified") {
        return 0;
    }

    const diffKeys = Object.keys(entry.diff).filter(isDiffSubjectKey); // Diff対象の科目プロパティだけに絞る
    const priorities = diffKeys.map((key) => {
        const index = modifiedPriorityOrder.indexOf(key);
        return index === -1 ? 0 : index + 1;
    });

    return priorities.length === 0 ? 0 : Math.min(...priorities);
};

export const prioritizeDiffEntries = (entries: DiffEntry[]): DiffEntry[] => {
    return entries
        .map((entry, index) => ({ entry, index, priority: getEntryPriority(entry) }))
        .sort((a, b) => a.priority - b.priority || a.index - b.index)
        .map(({ entry }) => entry);
};
