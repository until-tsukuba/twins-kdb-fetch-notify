export type Requisite = {
    readonly id: string;
    readonly name: string;
    readonly hasLower: boolean;
};

const instructionalTypeMap = {
    "0": { text: "その他", flags: { 講義: false, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: true } },
    "1": { text: "講義", flags: { 講義: true, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "2": { text: "演習", flags: { 講義: false, 演習: true, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "3": { text: "実習･実験･実技", flags: { 講義: false, 演習: false, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "4": { text: "講義及び演習", flags: { 講義: true, 演習: true, "実習･実験･実技": false, "卒業論文･卒業研究等": false, その他: false } },
    "5": { text: "講義及び実習･実験･実技", flags: { 講義: true, 演習: false, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "6": { text: "演習及び実習･実験･実技", flags: { 講義: false, 演習: true, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "7": { text: "講義、演習及び実習･実験･実技", flags: { 講義: true, 演習: true, "実習･実験･実技": true, "卒業論文･卒業研究等": false, その他: false } },
    "8": { text: "卒業論文･卒業研究等", flags: { 講義: false, 演習: false, "実習･実験･実技": false, "卒業論文･卒業研究等": true, その他: false } },
} as const;

type InstructionalTypeCode = keyof typeof instructionalTypeMap;

function isInstructionalTypeCode(code: string): code is InstructionalTypeCode {
    return code in instructionalTypeMap;
}

export const getInstructionalType = (code: string): (typeof instructionalTypeMap)[ InstructionalTypeCode ] => {
    if (!isInstructionalTypeCode(code)) {
        throw new Error(`Unknown instructional type code: ${code}`);
    }
    return instructionalTypeMap[ code ];
};

export type InstructionalType = (typeof instructionalTypeMap)[ InstructionalTypeCode ];

export const terms = [
    { text: "春学期", code: "A" },
    { text: "秋学期", code: "B" },
] as const;
export type Terms = (typeof terms)[ number ];

export const daysOfWeek = [ "月", "火", "水", "木", "金", "土", "日", "他" ] as const;
export type DaysOfWeek = (typeof daysOfWeek)[ number ];

export const periods = [ 1, 2, 3, 4, 5, 6, 7, 8 ] as const;
type Periods = (typeof periods)[ number ];

type TimeTable = {
    readonly day: DaysOfWeek; // 曜日
    readonly period: Periods | null; // 時限
};

type Module = "springA" | "springB" | "springC" | "summerVacation" | "fallA" | "fallB" | "fallC" | "springVacation";
export type ModuleTimeTable = Readonly<Record<Module, readonly TimeTable[]>>;

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
