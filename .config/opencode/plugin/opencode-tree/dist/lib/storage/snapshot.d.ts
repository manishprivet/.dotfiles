import { type TreeSnapshot } from "./schema";
export declare function readSnapshot(storageRoot: string, treeId: string): Promise<TreeSnapshot>;
export declare function writeSnapshot(storageRoot: string, snapshot: TreeSnapshot): Promise<TreeSnapshot>;
export declare function appendChildSession(snapshot: TreeSnapshot, input: {
    sessionId: string;
    parentSessionId: string;
    anchorMessageId: string;
}): TreeSnapshot;
