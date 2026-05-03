/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi, TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { TreeBranchSummaryRequest } from "../route-branching";
export type TreeBranchSummaryDialogUI = Pick<TuiPluginApi["ui"], "dialog">;
export type TreeBranchSummaryDialogProps = {
    readonly ui: TreeBranchSummaryDialogUI;
    readonly theme: TuiThemeCurrent;
    readonly onClose: () => void;
    readonly onCancelBusy: () => void;
    readonly onSelect: (request: TreeBranchSummaryRequest) => Promise<void> | void;
};
export declare function TreeBranchSummaryDialog(props: TreeBranchSummaryDialogProps): any;
