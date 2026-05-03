import type { TreeStorageScope } from "../config/plugin";
export type ResolveStorageRootInput = {
    readonly projectRoot: string;
    readonly stateRoot: string;
    readonly storageScope: TreeStorageScope;
};
export declare function resolveStorageRoot(input: ResolveStorageRootInput): string;
export declare function createProjectStorageKey(projectRoot: string): string;
