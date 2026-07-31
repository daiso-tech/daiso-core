import type { ComponentItemProps } from "../../data/types";
import Link from "@docusaurus/Link";
import styles from "../roadmap.module.css";

export function AvailableCategory({ label, items }: { label: string; items: readonly ComponentItemProps[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--ifm-color-emphasis-600)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div className={styles.availableGrid}>
        {items.map((item, i) => {
          const card = (
            <div className={styles.availableCard}>
              <span className={styles.availableCardIcon}>{item.icon}</span>
              <div className={styles.availableCardBody}>
                <div className={styles.availableCardTitle}>
                  {item.title}
                  {item.maturity !== undefined && (
                    <span className={item.maturity >= 95 ? styles.availableCardBadge : item.maturity >= 85 ? styles.badgeNearStable : styles.badgeExperimental}>
                      {item.maturity >= 95 ? "Stable" : item.maturity >= 85 ? "Near-stable" : "Experimental"}
                    </span>
                  )}
                </div>
                <p className={styles.availableCardDesc}>{item.description}</p>
              </div>
            </div>
          );
          return item.href ? (
            <Link key={i} to={item.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{card}</Link>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
