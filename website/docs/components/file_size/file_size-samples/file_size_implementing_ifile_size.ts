import { IFileSize, TO_BYTES } from "eridu-tech/file-size/contracts";

export class MyFileSize implements IFileSize {
    constructor(private readonly fileSizeInBytes: number) {}

    [TO_BYTES](): number {
        return this.fileSizeInBytes;
    }
}
