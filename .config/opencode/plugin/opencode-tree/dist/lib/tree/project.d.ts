import type { TuiState } from "@opencode-ai/plugin/tui";
import type { SessionTranscript, SessionTranscriptMap } from "../opencode/messages";
import type { TreeSnapshot } from "../storage";
export type OpenCodePathState = Pick<TuiState["path"], "worktree" | "directory">;
export type ProjectedMessageNode = {
    readonly kind: "message";
    readonly sessionId: string;
    readonly messageId: string;
    readonly record: SessionTranscriptMap[string]["messages"][number];
    readonly childSessions: readonly ProjectedSessionNode[];
};
export type ProjectedSessionNode = {
    readonly kind: "session";
    readonly sessionId: string;
    readonly status: SessionTranscript["status"];
    readonly childSessions: readonly ProjectedSessionNode[];
    readonly messages: readonly ProjectedMessageNode[];
};
export declare function resolveProjectRoot(path: OpenCodePathState): string | undefined;
export declare function projectSessionTree(snapshot: TreeSnapshot, transcripts: SessionTranscriptMap): ProjectedSessionNode;
