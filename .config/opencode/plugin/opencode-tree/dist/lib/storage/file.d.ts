import { ZodError, type ZodType } from "zod";
export declare class StorageFileError extends Error {
    readonly filePath: string;
    constructor(message: string, filePath: string, options?: ErrorOptions);
}
export declare class StorageJsonParseError extends StorageFileError {
    constructor(filePath: string, cause: unknown);
}
export declare class StorageSchemaError extends StorageFileError {
    readonly issues: ReadonlyArray<ZodError["issues"][number]>;
    constructor(filePath: string, issues: ZodError["issues"]);
}
export declare function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException;
export declare function readJsonFile<T>(filePath: string, schema: ZodType<T>): Promise<T>;
export declare function writeJsonFile<T>(filePath: string, schema: ZodType<T>, value: T): Promise<T>;
