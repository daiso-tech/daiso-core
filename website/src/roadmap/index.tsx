// All roadmap/component data now lives in `src/data/data.tsx`.
// This module re-exports it so existing consumers of the roadmap
// module keep working, with a single source of truth.

export {
    FOUNDATION_EXISTING_ITEMS,
    STORAGE_EXISTING_ITEMS,
    RELIABILITY_EXISTING_ITEMS,
    CONCURRENCY_EXISTING_ITEMS,
    MESSAGING_EXISTING_ITEMS,
    WEB_EXISTING_ITEMS,
    EXISTING_ITEMS,
    FOUNDATION_RUNTIME_ITEMS,
    RELIABILITY_MESSAGING_ITEMS,
    SECURITY_ITEMS,
    INTEGRATIONS_ITEMS,
    DEV_TOOLING_ITEMS,
    UPCOMING_ITEMS,
    COMPONENT_RECORD,
} from "../data/data";

export type { ComponentItemProps } from "../data/types";

