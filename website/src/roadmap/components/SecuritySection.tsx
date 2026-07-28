import { securityItems } from "../index";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function SecuritySection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={securityItems} /></section>);
}
