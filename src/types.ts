export type Requisite = {
    readonly id: string;
    readonly name: string;
    readonly hasLower: boolean;
};

export type InstructionalTypeCode = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type InstructionalTypeFlags = {
    readonly 講義: boolean;
    readonly 演習: boolean;
    readonly "実習･実験･実技": boolean;
    readonly "卒業論文･卒業研究等": boolean;
    readonly その他: boolean;
};

export type InstructionalType = {
    readonly text: InstructionalTypeCode;
    readonly flags: InstructionalTypeFlags;
};

export type Terms = { text: "春学期"; code: "A" } | { text: "秋学期"; code: "B" };

export type DaysOfWeek = "月" | "火" | "水" | "木" | "金" | "土" | "日" | "他";

export type Periods = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TimeTable = {
    readonly day: DaysOfWeek; // 曜日
    readonly period: Periods | null; // 時限
};

export type Module = "springA" | "springB" | "springC" | "summerVacation" | "fallA" | "fallB" | "fallC" | "springVacation";
export type ModuleTimeTable = Readonly<Record<Module, readonly TimeTable[]>>;

export type DiffModifiedValue = {
    [K in keyof MergedSubject]?: { from: MergedSubject[K]; to: MergedSubject[K] };
};

export type DiffEntry =
    | {
          type: "added" | "removed";
          value: MergedSubject;
      }
    | {
          type: "modified";
          value: MergedSubject;
          diff: DiffModifiedValue;
      };

export type DiffJson = Record<string, DiffEntry>;

export type DiffType = DiffEntry["type"];

export type MergedSubject = {
    code: string; // 科目番号
    name: string; // 科目名
    syllabusLatestLink: string | null; // シラバス最新リンク
    instructionalType: {
        value: InstructionalType | null;
        kdbRaw: string | null;
    }; // 授業方法
    credits: {
        value:
            | {
                  type: "normal";
                  value: number;
              }
            | {
                  type: "none";
              }
            | {
                  type: "unknown";
              }
            | null;
        kdbRaw: string | null;
    }; // 単位数
    year: {
        value:
            | {
                  type: "normal";
                  value: readonly number[];
              }
            | {
                  type: "unknown";
              };
        kdbRaw: string | null;
        twinsRaw: string | null;
    }; // 標準履修年次
    terms: {
        term: Terms | null; // 学期
        module: string | null; // 実施学期
        weekdayAndPeriod: string | null; // 曜時限
        moduleTimeTable: ModuleTimeTable | null; // モジュール時間割

        twinsRaw: {
            term: string;
            module: string;
        } | null;
    };
    classroom: null; // 教室
    instructor: {
        value: readonly string[];

        kdbRaw: string | null;
        twinsRaw: string | null;
    }; // 担当教員
    overview: string | null; // 授業概要
    remarks: string | null; // 備考
    auditor: string | null; // 科目等履修生申請可否
    conditionsForAuditors: string | null; // 申請条件
    exchangeStudent: string | null;
    conditionsForExchangeStudents: string | null;
    JaEnCourseName: string | null;
    parentNumber: string | null;
    parentCourseName: string | null;

    affiliation: {
        name: string | null;
        code: string | null;

        twinsRaw: {
            name: string;
            code: string;
        } | null;
    };

    requisite: readonly Requisite[];
    kdbDataUpdateDate: string | null;
};
