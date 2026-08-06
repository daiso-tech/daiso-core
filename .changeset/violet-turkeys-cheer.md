---
"eridu-tech": patch
---

Changed all type-only imports to the top-level `import type` form and adjusted the ESLint config accordingly, so the compiled output no longer emits runtime side-effect imports for type-only packages like `@standard-schema/spec` (fixes `ERR_MODULE_NOT_FOUND` for consumers).
