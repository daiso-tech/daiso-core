import { reliabilityMessagingItems } from "../index";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function ReliabilityMessagingSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={reliabilityMessagingItems} /></section>);
}
