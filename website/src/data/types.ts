import type { ReactNode } from "react";

export type FeatureItemProps = {
    name: string;
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
};

export type ComponentItemProps = FeatureItemProps & {
    href?: string;
    badges?: ReactNode[];
    subItems?: ReactNode[];
    maturity?: number;
    completedDate?: ReactNode;
};

export type WhoIsThisForItem = {
    name: string;
    title: ReactNode;
    description: ReactNode;
};

export type CodeFile = {
    name: string;
    code: string;
};

export type CodeExample = {
    name: string;
    label: ReactNode;
    heading: ReactNode;
    description: ReactNode;
    codeBlockDescription: ReactNode;
    bullets: ReactNode[];
    files: CodeFile[];
};

export type ComparisonItem = {
    name: string;
    heading: ReactNode;
    instead: ReactNode[];
    eriduTech: ReactNode[];
};
