import type { ComponentItemProps } from "../../data/types";
import styles from "../roadmap.module.css";

export function PlannedCardGrid({ items }: { items: readonly ComponentItemProps[] }) {
  return (
    <div className={styles.availableGrid}>
      {items.map((item, i) => (
        <div key={i} className={styles.plannedCard}>
          <span className={styles.plannedCardIcon}>{item.icon}</span>
          <div className={styles.plannedCardBody}>
            <div className={styles.plannedCardTitle}>{item.title}</div>
            <p className={styles.plannedCardDesc}>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
