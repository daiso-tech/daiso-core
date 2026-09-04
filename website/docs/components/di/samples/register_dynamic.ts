import { container } from "./initial_configuration";
import { REQUEST_ID } from "./request_id";

// Register as dynamic — value will be provided later
container.registerDynamic(REQUEST_ID);
