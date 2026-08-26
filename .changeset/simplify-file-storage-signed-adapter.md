---
"eridu-tech": minor
---

Simplified `FileStorage` to require a signed file storage adapter.

`FileStorage` and `FileStorageResolver` previously accepted any file storage adapter (signed or not) together with an optional partial `IFileUrlAdapter`, wrapping plain adapters internally in a `SignedFileStorageAdapter`. This wrapping is no longer done automatically.

Changes:

- `FileStorageSettings.adapter` now requires an `ISignedFileStorageAdapter` directly instead of `FileStorageAdapterVariants`.
- Removed the `urlAdapter` setting from `FileStorage` and the `setUrlAdapter` method from `FileStorageResolver`.
- Removed the `FileStorageAdapterVariants` contract type and the internal `isSignedFileStorageAdapter`.
- Moved `SignedFileStorageAdapter` (with its `MergedFileUrlAdapter` and `NoOpFileUrlAdapter` helpers) from `implementations/derivables/file-storage/` to the new public `implementations/adapters/signed-file-storage-adapter/` location, importable from `"eridu-tech/file-storage/signed-file-storage-adapter"`. Its constructor now takes a `{ adapter, urlAdapter }` settings object.
- `File` and `FileSerdeTransformer` no longer track a separate original adapter; serde transformer name resolution uses the adapter directly.

To customize URL generation, wrap your storage adapter in a `SignedFileStorageAdapter` before passing it to `FileStorage` or `FileStorageResolver`.
