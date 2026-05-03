import type { TuiRouteCurrent } from "@opencode-ai/plugin/tui";
export type TreeRouteParams = {
    readonly sessionID?: string;
};
export declare function isSessionRoute(current: TuiRouteCurrent): current is Extract<TuiRouteCurrent, {
    name: "session";
}>;
export declare function getTreeRouteParamsForNavigation(current: TuiRouteCurrent): TreeRouteParams | undefined;
export declare function parseTreeRouteParams(params: Record<string, unknown> | undefined): TreeRouteParams;
