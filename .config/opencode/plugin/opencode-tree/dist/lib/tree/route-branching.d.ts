/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi, TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { type Accessor } from "solid-js";
import { type SessionTranscriptMap } from "../opencode/messages";
import type { TreeBootstrapResult } from "./bootstrap";
import { type TreeBranchAction } from "./branch";
import { type TreeBranchSummaryDialogUI } from "./components/branch-summary-dialog";
import type { TreeFlatRow } from "./flatten";
type TreeForkAction = Extract<TreeBranchAction, {
    kind: "fork";
}>;
export type TreeBranchSummaryRequest = {
    readonly kind: "no-summary";
} | {
    readonly kind: "summarize";
    readonly customInstructions?: string;
};
export type TreeRouteBusyState = {
    readonly kind: "branching";
} | {
    readonly kind: "summarizing";
    readonly controller: AbortController;
};
export type TreeRouteBranchControllerInput = {
    readonly client: OpencodeClient;
    readonly ui: Pick<TuiPluginApi["ui"], "dialog"> & TreeBranchSummaryDialogUI;
    readonly theme: Accessor<TuiThemeCurrent>;
    readonly navigateToSession: (sessionId: string) => void | Promise<void>;
    readonly bootstrap: Accessor<TreeBootstrapResult | undefined>;
    readonly projectedTreeData: Accessor<{
        readonly transcripts: SessionTranscriptMap;
    } | undefined>;
    readonly selectedRow: Accessor<TreeFlatRow | undefined>;
};
export type TreeRouteBranchController = {
    readonly busyState: Accessor<TreeRouteBusyState | undefined>;
    readonly busy: Accessor<boolean>;
    readonly actionErrorMessage: Accessor<string | undefined>;
    readonly cancelActiveSummary: () => void;
    readonly openBranchSummaryDialog: (action: TreeForkAction) => void;
    readonly runTreeBranchAction: (action: TreeBranchAction) => void;
};
export declare function createTreeRouteBranchController(input: TreeRouteBranchControllerInput): TreeRouteBranchController;
export {};
