// All roadmap/component data now lives in `src/date/data.tsx`.
// This module re-exports it so existing consumers of the roadmap
// module keep working, with a single source of truth.

export {
    foundationExistingItems,
    storageExistingItems,
    reliabilityExistingItems,
    concurrencyExistingItems,
    messagingExistingItems,
    webExistingItems,
    existingItems,
    foundationRuntimeItems,
    reliabilityMessagingItems,
    securityItems,
    integrationsItems,
    devToolingItems,
    controlPlaneItems,
    upcomingItems,
    componentRecord,
} from "../date/data";

export type { ComponentItemProps } from "../date/data";

