import type { Message, OpencodeClient, Part } from "@opencode-ai/sdk/v2";
import type { TreeSnapshot } from "../storage";
export type SessionMessageRecord = {
    readonly info: Message;
    readonly parts: readonly Part[];
};
export type SessionTranscriptStatus = "available" | "deleted";
export type SessionTranscript = {
    readonly sessionId: string;
    readonly status: SessionTranscriptStatus;
    readonly messages: readonly SessionMessageRecord[];
    readonly messageById: ReadonlyMap<string, SessionMessageRecord>;
    readonly messageIndexById: ReadonlyMap<string, number>;
};
export type SessionTranscriptMap = Readonly<Record<string, SessionTranscript>>;
export type LoadSessionMessagesPageInput = {
    readonly sessionId: string;
    readonly before?: string;
    readonly limit: number;
};
export type SessionMessagesPage = {
    readonly status: SessionTranscriptStatus;
    readonly items: readonly SessionMessageRecord[];
    readonly nextCursor?: string;
};
export type LoadSessionMessagesPage = (input: LoadSessionMessagesPageInput) => Promise<SessionMessagesPage>;
export type LoadSessionTranscript = (sessionId: string) => Promise<SessionTranscript>;
export type LoadSnapshotSessionTranscripts = (snapshot: TreeSnapshot) => Promise<SessionTranscriptMap>;
export type OpenCodeMessagesLoaderOptions = {
    readonly directory?: string;
    readonly workspace?: string;
    readonly pageSize?: number;
};
export declare function createSessionTranscript(input: {
    sessionId: string;
    status: SessionTranscriptStatus;
    messages: readonly SessionMessageRecord[];
}): SessionTranscript;
export declare function createSessionMessagesPageLoader(client: OpencodeClient, options?: OpenCodeMessagesLoaderOptions): LoadSessionMessagesPage;
export declare function loadSessionTranscript(sessionId: string, loadPage: LoadSessionMessagesPage, pageSize?: number): Promise<SessionTranscript>;
export declare function loadSnapshotSessionTranscripts(snapshot: TreeSnapshot, loadTranscript: LoadSessionTranscript): Promise<SessionTranscriptMap>;
export declare function createSnapshotSessionTranscriptsLoader(client: OpencodeClient, options?: OpenCodeMessagesLoaderOptions): LoadSnapshotSessionTranscripts;
export declare function getMessageTextReplay(parts: readonly Part[]): string | undefined;
export declare function serializeSessionMessageRecordsForSummary(messages: readonly SessionMessageRecord[]): string;
