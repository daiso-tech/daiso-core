import { devToolingItems } from "../index";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function DevToolingSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={devToolingItems} /></section>);
}
