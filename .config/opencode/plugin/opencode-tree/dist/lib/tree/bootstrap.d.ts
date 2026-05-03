import { type TreeRegistry, type TreeSnapshot } from "../storage";
export type TreeIdGenerator = () => string;
export type MissingSessionContextBootstrapResult = {
    readonly kind: "missing-session-context";
    readonly projectRoot: string;
    readonly storageRoot: string;
};
export type FoundTreeBootstrapResult = {
    readonly kind: "found-tree";
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly treeId: string;
    readonly currentSessionId: string;
    readonly snapshot: TreeSnapshot;
};
export type CreatedTreeBootstrapResult = {
    readonly kind: "created-tree";
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly treeId: string;
    readonly currentSessionId: string;
    readonly snapshot: TreeSnapshot;
};
export type TreeBootstrapResult = MissingSessionContextBootstrapResult | FoundTreeBootstrapResult | CreatedTreeBootstrapResult;
export type TreeBootstrapInput = {
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly sessionID?: string;
};
export type TreeBootstrapStorage = {
    readRegistry(storageRoot: string): Promise<TreeRegistry>;
    writeRegistry(storageRoot: string, registry: TreeRegistry): Promise<TreeRegistry>;
    readSnapshot(storageRoot: string, treeId: string): Promise<TreeSnapshot>;
    writeSnapshot(storageRoot: string, snapshot: TreeSnapshot): Promise<TreeSnapshot>;
};
export type TreeBootstrapDependencies = {
    readonly storage: TreeBootstrapStorage;
    readonly createTreeId: TreeIdGenerator;
};
export declare function createTreeId(generateUUID?: TreeIdGenerator): string;
export declare function createRootTreeSnapshot(treeId: string, sessionID: string): TreeSnapshot;
export declare function bootstrapTree(input: TreeBootstrapInput, dependencies?: TreeBootstrapDependencies): Promise<TreeBootstrapResult>;
