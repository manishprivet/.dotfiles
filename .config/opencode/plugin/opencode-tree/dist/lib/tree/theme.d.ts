import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { TreeFlatRow } from "./flatten";
export type TreeThemePalette = {
    readonly screenBackground: TuiThemeCurrent["background"];
    readonly panelBackground: TuiThemeCurrent["backgroundPanel"];
    readonly panelBorder: TuiThemeCurrent["borderSubtle"];
    readonly selectedRowBackground: TuiThemeCurrent["backgroundElement"];
    readonly selectedRowBorder: TuiThemeCurrent["borderActive"];
    readonly guideText: TuiThemeCurrent["primary"];
    readonly helpText: TuiThemeCurrent["textMuted"];
    readonly helpKey: TuiThemeCurrent["accent"];
    readonly loadingText: TuiThemeCurrent["info"];
    readonly emptyText: TuiThemeCurrent["textMuted"];
    readonly errorText: TuiThemeCurrent["error"];
    readonly noticeText: TuiThemeCurrent["warning"];
    readonly branchingText: TuiThemeCurrent["accent"];
};
export type TreeRowStyleState = {
    readonly selected: boolean;
    readonly current: boolean;
};
export declare function mapTreeTheme(theme: TuiThemeCurrent): TreeThemePalette;
export declare function getTreeRowForeground(theme: TuiThemeCurrent, row: TreeFlatRow, _state: TreeRowStyleState): TuiThemeCurrent["text"];
export declare function getTreeRowBackground(theme: TuiThemeCurrent, state: TreeRowStyleState): TuiThemeCurrent["backgroundElement"] | undefined;
export declare function getTreeRowBorder(theme: TuiThemeCurrent, state: TreeRowStyleState): TuiThemeCurrent["borderActive"] | undefined;
