import type { ComponentItemProps } from "../../data/types";
import Link from "@docusaurus/Link";
import styles from "../roadmap.module.css";

export function AvailableCategory({ label, items, variant = "compact" }: { label: string; items: readonly ComponentItemProps[]; variant?: "compact" | "feature" }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--ifm-color-emphasis-600)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div className={variant === "feature" ? "row" : styles.availableGrid}>
        {items.map((item, i) => {
          const badge =
            item.maturity !== undefined ? (
              <span className={item.maturity >= 95 ? styles.availableCardBadge : item.maturity >= 85 ? styles.badgeNearStable : styles.badgeExperimental}>
                {item.maturity >= 95 ? "Stable" : item.maturity >= 85 ? "Near-stable" : "Experimental"}
              </span>
            ) : null;
          const inner =
            variant === "feature" ? (
              <div className="daiso-feature-card">
                <div className="daiso-feature-icon">{item.icon}</div>
                <h3>{item.title}{badge}</h3>
                <p>{item.description}</p>
              </div>
            ) : (
              <div className={styles.availableCard}>
                <span className={styles.availableCardIcon}>{item.icon}</span>
                <div className={styles.availableCardBody}>
                  <div className={styles.availableCardTitle}>{item.title}{badge}</div>
                  <p className={styles.availableCardDesc}>{item.description}</p>
                </div>
              </div>
            );
          const card = item.href ? (
            <Link to={item.href} style={{ textDecoration: "none", color: "inherit", display: "block", ...(variant === "feature" ? { height: "100%" } : {}) }}>{inner}</Link>
          ) : (
            inner
          );
          return variant === "feature" ? (
            <div className="col col--6 margin-bottom--lg" key={i}>{card}</div>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
