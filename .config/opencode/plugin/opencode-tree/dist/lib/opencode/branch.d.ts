import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { generateTreeBranchSummary } from "./summary";
import { type TreeRegistry, type TreeSnapshot } from "../storage";
import type { TreeBranchAction, TreeBranchForkPlan } from "../tree/branch";
export type TreeBranchStorage = {
    readRegistry(storageRoot: string): Promise<TreeRegistry>;
    writeRegistry(storageRoot: string, registry: TreeRegistry): Promise<TreeRegistry>;
    writeSnapshot(storageRoot: string, snapshot: TreeSnapshot): Promise<TreeSnapshot>;
};
export type ExecuteTreeBranchActionInput = {
    readonly action: TreeBranchAction;
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly snapshot: TreeSnapshot;
};
export type ExecuteTreeBranchActionDependencies = {
    readonly client: OpencodeClient;
    readonly navigateToSession: (sessionId: string) => void | Promise<void>;
    readonly generateSummary?: typeof generateTreeBranchSummary;
    readonly storage?: TreeBranchStorage;
};
export type ExecuteTreeForkPlanInput = {
    readonly plan: TreeBranchForkPlan;
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly snapshot: TreeSnapshot;
};
export type TreeForkExecutionResult = {
    readonly forkedSessionId: string;
    readonly appendPromptText?: string;
};
export type CompleteTreeForkTransitionInput = {
    readonly forkedSessionId: string;
    readonly appendPromptText?: string;
    readonly projectRoot: string;
};
export type ExecuteTreeSummaryForkInput = {
    readonly plan: TreeBranchForkPlan;
    readonly projectRoot: string;
    readonly storageRoot: string;
    readonly snapshot: TreeSnapshot;
    readonly conversation: string;
    readonly customInstructions?: string;
    readonly signal?: AbortSignal;
};
export declare function executeTreeBranchAction(input: ExecuteTreeBranchActionInput, dependencies: ExecuteTreeBranchActionDependencies): Promise<void>;
export declare function executeTreeForkPlan(input: ExecuteTreeForkPlanInput, dependencies: ExecuteTreeBranchActionDependencies): Promise<TreeForkExecutionResult>;
export declare function executeTreeSummaryFork(input: ExecuteTreeSummaryForkInput, dependencies: ExecuteTreeBranchActionDependencies): Promise<void>;
export declare function completeTreeForkTransition(input: CompleteTreeForkTransitionInput, dependencies: Pick<ExecuteTreeBranchActionDependencies, "client" | "navigateToSession">): Promise<void>;
