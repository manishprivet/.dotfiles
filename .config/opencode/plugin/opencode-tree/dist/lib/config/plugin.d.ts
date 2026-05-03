import { z } from "zod";
export declare const treeStorageScopeSchema: z.ZodEnum<["global", "local"]>;
export type TreeStorageScope = z.infer<typeof treeStorageScopeSchema>;
export type TreePluginOptions = {
    readonly storageScope: TreeStorageScope;
};
export declare function parseTreePluginOptions(options: unknown): TreePluginOptions;
