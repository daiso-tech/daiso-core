import { RELIABILITY_MESSAGING_ITEMS } from "../../data/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function ReliabilityMessagingSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={RELIABILITY_MESSAGING_ITEMS} /></section>);
}
