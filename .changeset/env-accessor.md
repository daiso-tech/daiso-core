---
"@daiso-tech/core": minor
---

Introduced new component `@daiso-tech/core/env-accessor`, including the `EnvAccessor` class and the `IEnvAccessor` contract. This component provides a type-safe way to read enviroment variables, with support for required schema validation, default values and multiple sources (e.g you can read from aws secret manager and process.env and merge them together).

