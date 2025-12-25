import { diffJsonUrl } from "./envs.js";

type Terms = { text: "春学期"; code: "A" } | { text: "秋学期"; code: "B" };

type DaysOfWeek = "月" | "火" | "水" | "木" | "金" | "土" | "日" | "他";

type Periods = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type TimeTable = {
    day: DaysOfWeek;
    period: Periods | null;
};

type Module =
    | "springA"
    | "springB"
    | "springC"
    | "summerVacation"
    | "fallA"
    | "fallB"
    | "fallC"
    | "springVacation";

type ModuleTimeTable = Record<Module, TimeTable[]>;

type DiffSubjectRawItem =
    | string
    | {
          text: string;
          onclick: string;
      };

type DiffSubject = {
    name: string;
    code: string;
    term: Terms;
    moduleTimeTable: ModuleTimeTable;
    instructors: string[];
    affiliation: {
        name: string;
        code: string;
    };
    year: number[];
    raw: DiffSubjectRawItem[];
};

type DiffModifiedValue = {
    [K in keyof DiffSubject]?: { from: DiffSubject[K]; to: DiffSubject[K] };
};

type DiffEntry =
    | {
          type: "added" | "removed";
          value: DiffSubject;
      }
    | {
          type: "modified";
          value: DiffSubject;
          diff: DiffModifiedValue;
      };

export type DiffJson = Record<string, DiffEntry>;

export const fetchDiffJson = async (url: string = diffJsonUrl): Promise<DiffJson> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`diff.jsonの取得に失敗しました: ${response.status} ${response.statusText}`);
    }

    const data: DiffJson = await response.json();

    return data;
};
