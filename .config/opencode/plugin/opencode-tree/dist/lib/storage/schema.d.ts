import { z } from "zod";
export declare const STORAGE_VERSION: 1;
export declare const sessionIDSchema: z.ZodString;
export declare const treeIDSchema: z.ZodString;
export declare const messageIDSchema: z.ZodString;
export declare const registrySchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    sessions: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strict", z.ZodTypeAny, {
    version: 1;
    sessions: Record<string, string>;
}, {
    version: 1;
    sessions: Record<string, string>;
}>;
export declare const snapshotSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    parentSessionId: z.ZodNullable<z.ZodString>;
    anchorMessageId: z.ZodNullable<z.ZodString>;
    children: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    sessionId: string;
    parentSessionId: string | null;
    anchorMessageId: string | null;
    children: string[];
}, {
    sessionId: string;
    parentSessionId: string | null;
    anchorMessageId: string | null;
    children: string[];
}>;
export declare const snapshotSchema: z.ZodEffects<z.ZodObject<{
    version: z.ZodLiteral<1>;
    treeId: z.ZodString;
    rootSessionId: z.ZodString;
    sessions: z.ZodRecord<z.ZodString, z.ZodObject<{
        sessionId: z.ZodString;
        parentSessionId: z.ZodNullable<z.ZodString>;
        anchorMessageId: z.ZodNullable<z.ZodString>;
        children: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }>>;
}, "strict", z.ZodTypeAny, {
    version: 1;
    sessions: Record<string, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }>;
    treeId: string;
    rootSessionId: string;
}, {
    version: 1;
    sessions: Record<string, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }>;
    treeId: string;
    rootSessionId: string;
}>, {
    version: 1;
    sessions: Record<string, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }>;
    treeId: string;
    rootSessionId: string;
}, {
    version: 1;
    sessions: Record<string, {
        sessionId: string;
        parentSessionId: string | null;
        anchorMessageId: string | null;
        children: string[];
    }>;
    treeId: string;
    rootSessionId: string;
}>;
export type TreeRegistry = z.infer<typeof registrySchema>;
export type TreeSnapshotSession = z.infer<typeof snapshotSessionSchema>;
export type TreeSnapshot = z.infer<typeof snapshotSchema>;
export declare function createEmptyRegistry(): TreeRegistry;
