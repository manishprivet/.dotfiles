import { type SessionMessageRecord, type SessionTranscriptMap } from "../opencode/messages";
import type { TreeFlatRow } from "./flatten";
export type TreeBranchForkPlan = {
    readonly sessionId: string;
    readonly anchorMessageId: string;
    readonly forkMessageId: string;
    readonly appendPromptText?: string;
};
export type TreeBranchAction = {
    readonly kind: "fork";
    readonly plan: TreeBranchForkPlan;
} | {
    readonly kind: "switch-session";
    readonly sessionId: string;
} | {
    readonly kind: "noop";
} | {
    readonly kind: "show-notice";
    readonly message: string;
    readonly variant: "info" | "success" | "warning" | "error";
};
export declare function isTreeBranchForkAction(action: TreeBranchAction): action is Extract<TreeBranchAction, {
    kind: "fork";
}>;
export type PlanTreeBranchActionInput = {
    readonly row: TreeFlatRow | undefined;
    readonly transcripts: SessionTranscriptMap;
};
export type TreeBranchSummarySlice = {
    readonly sessionId: string;
    readonly startMessageId: string;
    readonly messages: readonly SessionMessageRecord[];
};
export type CollectTreeBranchSummarySliceInput = {
    readonly row: TreeFlatRow | undefined;
    readonly transcripts: SessionTranscriptMap;
};
export declare function planTreeBranchAction(input: PlanTreeBranchActionInput): TreeBranchAction;
export declare function collectTreeBranchSummarySlice(input: CollectTreeBranchSummarySliceInput): TreeBranchSummarySlice;
