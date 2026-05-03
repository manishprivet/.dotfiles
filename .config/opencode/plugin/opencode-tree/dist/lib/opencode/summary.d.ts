import type { OpencodeClient } from "@opencode-ai/sdk/v2";
export declare const TREE_BRANCH_SUMMARIZATION_SYSTEM_PROMPT = "You are a context summarization assistant. Your task is to read a conversation between a user and an AI coding assistant, then produce a structured summary following the exact format specified.\n\nDo NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured summary.";
export declare const TREE_BRANCH_SUMMARY_INSTRUCTIONS = "Create a structured summary of this conversation branch for context when returning later.\n\nUse this EXACT format:\n\n## Goal\n[What was the user trying to accomplish in this branch?]\n\n## Constraints & Preferences\n- [Any constraints, preferences, or requirements mentioned]\n- [Or \"(none)\" if none were mentioned]\n\n## Progress\n### Done\n- [x] [Completed tasks/changes]\n\n### In Progress\n- [ ] [Work that was started but not finished]\n\n### Blocked\n- [Issues preventing progress, if any]\n\n## Key Decisions\n- **[Decision]**: [Brief rationale]\n\n## Next Steps\n1. [What should happen next to continue this work]\n\nKeep each section concise. Preserve exact file paths, function names, and error messages.";
export declare const TREE_BRANCH_SUMMARY_PREAMBLE = "The user explored a different conversation branch before returning here.\nSummary of that exploration:\n\n";
export type BuildTreeBranchSummaryPromptInput = {
    readonly conversation: string;
    readonly customInstructions?: string;
};
export type GenerateTreeBranchSummaryInput = {
    readonly projectRoot: string;
    readonly conversation: string;
    readonly customInstructions?: string;
    readonly agent?: string;
    readonly signal?: AbortSignal;
    readonly model?: {
        readonly providerID: string;
        readonly modelID: string;
    };
};
export type GenerateTreeBranchSummaryDependencies = {
    readonly client: OpencodeClient;
};
export declare function buildTreeBranchSummaryInstructions(customInstructions?: string): string;
export declare function buildTreeBranchSummaryPrompt(input: BuildTreeBranchSummaryPromptInput): string;
export declare function buildTreeBranchSummaryMessage(summary: string): string;
export declare function generateTreeBranchSummary(input: GenerateTreeBranchSummaryInput, dependencies: GenerateTreeBranchSummaryDependencies): Promise<string>;
