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
    readonly text: string;
    readonly flags: InstructionalTypeFlags;
};

const instructionalTypeMap: Record<InstructionalTypeCode, InstructionalType> = {
    "0": { text: "その他", flags: { 講義: false, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: true } },
    "1": { text: "講義", flags: { 講義: true, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "2": { text: "演習", flags: { 講義: false, 演習: true, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "3": { text: "実習･実験･実技", flags: { 講義: false, 演習: false, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "4": { text: "講義及び演習", flags: { 講義: true, 演習: true, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "5": { text: "講義及び実習･実験･実技", flags: { 講義: true, 演習: false, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "6": { text: "演習及び実習･実験･実技", flags: { 講義: false, 演習: true, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "7": { text: "講義、演習及び実習･実験･実技", flags: { 講義: true, 演習: true, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "8": { text: "卒業論文･卒業研究等", flags: { 講義: false, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": true, その他: false } },
};

function isInstructionalTypeCode(code: string): code is InstructionalTypeCode {
    return code in instructionalTypeMap;
}

export const getInstructionalType = (code: string): InstructionalType => {
    if (!isInstructionalTypeCode(code)) {
        throw new Error(`Unknown instructional type code: ${code}`);
    }
    return instructionalTypeMap[code];
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

export type DiffSubjectRawItem =
    | string
    | {
          text: string;
          onclick: string;
      };

export type DiffSubject = {
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

export type DiffModifiedValue = {
    [K in keyof DiffSubject]?: { from: DiffSubject[K]; to: DiffSubject[K] };
};

export type DiffEntry =
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

    affiliation: {
        name: string | null;
        code: string | null;

        twinsRaw: {
            name: string;
            code: string;
        } | null;
    };

    requisite: readonly Requisite[];
};
