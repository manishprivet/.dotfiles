/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi, TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import type { LoadSnapshotSessionTranscripts } from "../opencode/messages";
import type { TreeBranchSummaryDialogUI } from "./components/branch-summary-dialog";
export type TreeRouteProps = {
    readonly client: OpencodeClient;
    readonly ui: Pick<TuiPluginApi["ui"], "dialog"> & TreeBranchSummaryDialogUI;
    readonly projectRoot?: string;
    readonly storageRoot?: string;
    readonly sessionID?: string;
    readonly theme: () => TuiThemeCurrent;
    readonly loadSessionTranscripts: LoadSnapshotSessionTranscripts;
    readonly navigateToSession: (sessionId: string) => void | Promise<void>;
};
export declare function TreeRoute(props: TreeRouteProps): any;
