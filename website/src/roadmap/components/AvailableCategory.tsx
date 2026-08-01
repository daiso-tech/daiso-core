import type { ComponentItemProps } from "../../data/types";
import Link from "@docusaurus/Link";
import styles from "../roadmap.module.css";
import { FeatureItem } from "../../components/FeatureItem";

export function AvailableCategory({ label, items }: { label: string; items: readonly ComponentItemProps[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--ifm-color-emphasis-600)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div className="row">
        {items.map((item, i) => {
          const badge =
            item.maturity !== undefined ? (
              <span className={item.maturity >= 95 ? styles.availableCardBadge : item.maturity >= 85 ? styles.badgeNearStable : styles.badgeExperimental}>
                {item.maturity >= 95 ? "Stable" : item.maturity >= 85 ? "Near-stable" : "Experimental"}
              </span>
            ) : undefined;
          const card = <FeatureItem {...item} badge={badge} />;
          return (
            <div className="col col--4 margin-bottom--lg" key={i}>
              {item.href ? (
                <Link to={item.href} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>{card}</Link>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
