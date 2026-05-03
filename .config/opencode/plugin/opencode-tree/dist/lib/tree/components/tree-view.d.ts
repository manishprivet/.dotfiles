/** @jsxImportSource @opentui/solid */
import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { TreeFlatRow } from "../flatten";
export type TreeViewProps = {
    readonly rows: readonly TreeFlatRow[];
    readonly selectedIndex?: number;
    readonly width: number;
    readonly theme: () => TuiThemeCurrent;
    readonly autoFocus?: boolean;
    readonly onFocusChange?: (focused: boolean) => void;
};
export declare function TreeView(props: TreeViewProps): any;
