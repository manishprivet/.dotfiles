import type { ProjectedMessageNode, ProjectedSessionNode } from "./project";
export type SessionFlatRow = {
    readonly kind: "session";
    readonly id: `session:${string}`;
    readonly depth: number;
    readonly sessionId: string;
    readonly currentSessionId: string;
    readonly title: string;
    readonly isDeleted: boolean;
};
export type MessageFlatRow = {
    readonly kind: "message";
    readonly id: `message:${string}:${string}`;
    readonly depth: number;
    readonly sessionId: string;
    readonly currentSessionId: string;
    readonly messageId: string;
    readonly role: ProjectedMessageNode["record"]["info"]["role"];
    readonly preview: string;
};
export type TreeFlatRow = SessionFlatRow | MessageFlatRow;
export type FlatTreeRows = {
    readonly rows: readonly TreeFlatRow[];
    readonly lastRowIndexBySessionId: Readonly<Record<string, number>>;
};
export declare function buildFlatRows(root: ProjectedSessionNode, currentSessionId: string): FlatTreeRows;
