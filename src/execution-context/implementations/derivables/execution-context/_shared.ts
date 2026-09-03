import { isClass } from "@/utilities/_module.js";

import type { ContextToken } from "@/execution-context/contracts/_module.js";

export function tokenToString<T>(diToken: ContextToken<T>): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.description;
}
