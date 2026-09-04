import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { TimeSpan } from "eridu-tech/time-span";

const serde = new Serde(new SuperJsonSerdeAdapter());

serde.registerClass(TimeSpan);

const timeSpan = TimeSpan.fromSeconds(12);
const serializedTimeSpan = serde.serialize(timeSpan);
const deserializedTimeSpan = serde.deserialize(serializedTimeSpan);

// logs false
console.log(serializedTimeSpan === deserializedTimeSpan);
