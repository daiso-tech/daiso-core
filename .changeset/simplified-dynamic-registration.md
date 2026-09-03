---
"eridu-tech": minor
---

- Reworked context tokens and unified them across modules. In the execution-context module, `ContextToken` is now a union of a new `ClassToken` (a class constructor used directly as the key) and `GenericToken`, whose identifier is a string `description` instead of a runtime-unique symbol. The DI `DiToken` is now a type alias of the execution-context `ContextToken`, so dependency injection and execution context now share a single token type.
- Reworked `IDynamicServiceRegister`, used to set dynamic values inside `run()`:
    - `set` no longer accepts a `DynamicValueWrapper` callback as its value and is now synchronous. It writes the value directly to the execution context and implicitly overwrites an existing value for the token.
    - Added `get` and `getOrFail` to read a dynamic value, and `has` to check whether one is available. `getOrFail` throws `CanNotResolveServiceDiError` when the token is not registered as dynamic or has no value.
- Dynamic values are now stored in and read from the execution context directly, instead of the container's isolated registry.
- Renamed the `run()` setting `dynamicRegistration` to `registration`.
- Added DI error flags thrown by the `IDynamicServiceRegister` methods:
    - `IDynamicServiceRegister.set` throws `CanNotRegisterServiceDiError.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC` when the token is not registered as dynamic, and `CanNotRegisterServiceDiError.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST` when the token does not exist.
    - `IDynamicServiceRegister.getOrFail` throws `CanNotResolveServiceDiError.DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN` when the token is not registered as dynamic.
