---
"eridu-tech": minor
---

# Re-add built-in schema validation for `Cache` and `EventBus`

Re-added schema validation directly to the `Cache` and `EventBus` classes to improve the developer experience. Schemas are now inferred automatically from the corresponding settings, and the schema plugins are no longer part of the public API.

## Changes

- `Cache` now accepts `schema` and `shouldValidateOutput` settings for validating cache values against a Standard-schema on write and, optionally, on read. `CacheSettingsBase` and `CacheSettings` are now generic over the cache value type.
- `CacheResolver` now provides a `setSchema` method. `CacheAdapters` and `CacheResolverSettings` are now generic over the cache value type.
- `EventBus` now accepts `eventMapSchema` and `shouldValidateListeners` settings for validating event data against a Standard-schema on dispatch and, optionally, when delivering events to listeners. `EventBusSettingsBase` and `EventBusSettings` are now generic over the event map.
- `EventBusResolver` now provides a `setEventMapSchema` method, and its settings are now generic over the event map.
- `withCacheSchema` and `withEventBusSchema` are no longer public plugins. They have been moved from `eridu-tech/cache/plugins` and `eridu-tech/event-bus/plugins` to internal derivables and are applied automatically by the `Cache` and `EventBus` constructors.
- If you previously applied `withCacheSchema` or `withEventBusSchema` manually, remove the plugin and configure the corresponding schema settings on `Cache` or `EventBus` instead.
