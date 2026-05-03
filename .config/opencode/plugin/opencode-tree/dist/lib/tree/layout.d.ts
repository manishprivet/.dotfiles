import type { TreeFlatRow } from "./flatten";
export declare const TREE_ROUTE_HORIZONTAL_PADDING = 2;
export type FormatTreeRowInput = {
    readonly row: TreeFlatRow;
    readonly selected: boolean;
    readonly current: boolean;
    readonly width: number;
};
export declare function getTreeContentWidth(viewportWidth: number): number;
export type FormattedTreeRow = {
    readonly prefix: string;
    readonly body: string;
};
export declare function formatTreeRowParts(input: FormatTreeRowInput): FormattedTreeRow;
export declare function formatTreeRow(input: FormatTreeRowInput): string;
