import type { ReactNode } from "react";
import type { FeatureItemProps } from "../data/types";

export function FeatureItem({ icon, title, description, badge }: FeatureItemProps & { badge?: ReactNode }) {
    return (
        <div className="daiso-feature-card">
            <div className="daiso-feature-icon">{icon}</div>
            <h3>
                {title}
                {badge}
            </h3>
            <p>{description}</p>
        </div>
    );
}
