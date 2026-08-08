export interface DocusaurusMetadata {
    title?: string;
    description?: string;
    routePath: string;
    frontMatter?: Record<string, any>;
    contentTitle?: string;
    category?: string;
    permalink?: string;
    editUrl?: string;
    tags?: Array<{ label: string; permalink: string }>;
    version?: string;
    lastUpdatedAt?: number;
    lastUpdatedBy?: string;
    formattedLastUpdatedAt?: string;
    [key: string]: any;
}

export interface OgGeneratorParams {
    metadata: DocusaurusMetadata;
    assetsDir: string;
}

export type OgGenerator = (params: OgGeneratorParams) => Promise<Buffer> | Buffer;

export interface PluginOptions {
    ogGenerator?: OgGenerator;
    assetsDir?: string;
}

export interface GenerateImageOptions {
    ogGenerator: OgGenerator;
    assetsDir: string;
}
