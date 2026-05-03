import { type TreeRegistry } from "./schema";
export declare function readRegistry(storageRoot: string): Promise<TreeRegistry>;
export declare function writeRegistry(storageRoot: string, registry: TreeRegistry): Promise<TreeRegistry>;
export declare function registerSessionTree(registry: TreeRegistry, sessionId: string, treeId: string): TreeRegistry;
