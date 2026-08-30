---
"eridu-tech": minor
---

Simplified the HttpRouter component with a unified schema-aware request API.

### Breaking changes

- Replaced the `raw*` request accessors (`rawCookies`, `rawJson`, `rawFormData`, `rawParams`, `rawSearchParams`, `rawHeaders`) with `cookies()`, `json()`, `params()`, `searchParams()`, `headers()`, `fields()`, and `files()`.
- Removed the `withSchema()` flow along with the `IValidatedHttpReq`, `IHttpReqBase`, `IHttpReqValidation`, `HttpReqSchemas`, and `ReqInputs` types. Each request accessor now accepts an optional Standard Schema directly and returns the validated result.
- Removed the `ValidatedHttpReq` implementation.
- `IHttpFileCollection.count` is now the `size()` method, and `IHttpFileCollection.isEmpty` is now the `isEmpty()` method.
- `IHttpFileCollection.getOrFail()` and `firstOrFail()` now throw an `HttpError` with status `400` instead of the removed `FileIndexOutOfBoundsError` and `EmptyFileCollectionError`.
- Removed the `FileIndexOutOfBoundsError` and `EmptyFileCollectionError` error classes.
- `StaticFileDef.name` now accepts only a `RegExp` (previously `string | RegExp`).
- `DynamicFileDef` now receives the uploaded `IHttpFileCollection` and returns an error message `string | null` (previously received an `IHttpFile` and returned a `StaticFileDef`).

### Additions

- Added `CoercibleStringInputs` and `CoercibleMultiStringInputs` output types for schema-validated request data.
- Added `payload` to `HttpError` (and `HttpErrorSettings.payload`), now used to carry validation issues.

### Validation behavior

- Validation failures in `HttpReq` now throw an `HttpError` with status `400` and the validation issues attached as `payload`, instead of throwing `ValidationError`.
