import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import type { IFile } from "eridu-tech/file-storage/contracts";
import { FileStorage } from "eridu-tech/file-storage";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-file-over-network": {
        file: IFile;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const fileStorage = new FileStorage({
    serde,
    adapter: new SignedFileStorageAdapter({
        adapter: new MemoryFileStorageAdapter(),
        urlAdapter: {},
    }),
});
const file = fileStorage.create("file.txt");

// We are sending the file over the network to other servers.
await eventBus.dispatch("sending-file-over-network", {
    file,
});

// The other servers will recieve the serialized file and automattically deserialize it.
await eventBus.addListener("sending-file-over-network", ({ file }) => {
    // The file is deserialized and can be used
    console.log("file:", file);
});
