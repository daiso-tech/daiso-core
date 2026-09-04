import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
} from "eridu-tech/file-storage/contracts";

const signedFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new MemoryFileStorageAdapter(),
    urlAdapter: {
        async getPublicUrl(key: string): Promise<string | null> {
            return `https://cdn.example.com/${key}`;
        },
        async getSignedDownloadUrl(
            key: string,
            settings: FileAdapterSignedDownloadUrlSettings,
        ): Promise<string | null> {
            return generateSignedDownloadUrl(key, settings);
        },
        async getSignedUploadUrl(
            key: string,
            settings: FileAdapterSignedUploadUrlSettings,
        ): Promise<string> {
            return generateSignedUploadUrl(key, settings);
        },
    },
});
