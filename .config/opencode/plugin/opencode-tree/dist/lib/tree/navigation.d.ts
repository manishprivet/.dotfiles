import type { FlatTreeRows, TreeFlatRow } from "./flatten";
export declare function getInitialSelectedRowIndex(flatTree: FlatTreeRows, currentSessionId: string): number | undefined;
export declare function moveSelectionUp(rows: readonly TreeFlatRow[], currentIndex: number | undefined): number | undefined;
export declare function moveSelectionDown(rows: readonly TreeFlatRow[], currentIndex: number | undefined): number | undefined;
export declare function moveSelection(rows: readonly TreeFlatRow[], currentIndex: number | undefined, delta: number): number | undefined;
