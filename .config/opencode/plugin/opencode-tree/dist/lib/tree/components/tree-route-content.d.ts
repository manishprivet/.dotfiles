/** @jsxImportSource @opentui/solid */
import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { TreeFlatRow } from "../flatten";
import type { TreeThemePalette } from "../theme";
export type TreeRouteStatusTone = "notice" | "loading" | "error" | "empty";
export type TreeRouteBodyState = {
    readonly kind: "status";
    readonly tone: TreeRouteStatusTone;
    readonly message: string;
} | {
    readonly kind: "ready";
    readonly rows: readonly TreeFlatRow[];
};
export type ResolveTreeRouteBodyStateInput = {
    readonly projectRoot?: string;
    readonly bootstrapLoading: boolean;
    readonly bootstrapErrorMessage?: string;
    readonly missingSessionContext: boolean;
    readonly projectedLoading: boolean;
    readonly projectedErrorMessage?: string;
    readonly rows: readonly TreeFlatRow[];
};
export type TreeRouteHelpPanelProps = {
    readonly palette: TreeThemePalette;
    readonly busy: boolean;
};
export type TreeRouteStatusPanelProps = {
    readonly palette: TreeThemePalette;
    readonly tone: TreeRouteStatusTone;
    readonly message: string;
};
export type TreeRouteBodyProps = {
    readonly state: TreeRouteBodyState;
    readonly palette: TreeThemePalette;
    readonly theme: () => TuiThemeCurrent;
    readonly selectedIndex: number | undefined;
    readonly treeWidth: number;
    readonly onFocusChange: (focused: boolean) => void;
};
export declare function resolveTreeRouteBodyState(input: ResolveTreeRouteBodyStateInput): TreeRouteBodyState;
export declare function TreeRouteHelpPanel(props: TreeRouteHelpPanelProps): any;
export declare function TreeRouteStatusPanel(props: TreeRouteStatusPanelProps): any;
export declare function TreeRouteBody(props: TreeRouteBodyProps): any;
