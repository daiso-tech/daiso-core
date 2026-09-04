import { genericToken } from "eridu-tech/di/contracts";

export interface AppConfig {
    apiUrl: string;
    timeout: number;
}

export const CONFIG = genericToken<AppConfig>("AppConfig");
