---
"@daiso-tech/core": minor
---

#### Added ExecutionContext support for managing execution state and context propagation. Includes:

- `IExecutionContext` contract defining the execution context interface
- `ExecutionContext` class for managing execution state
- `AlsExecutionContextAdapter` for AsyncLocalStorage-based context tracking
- `NoOpExecutionContextAdapter` for environments without context support
- Context management utilities for tracking execution flow across async operations
