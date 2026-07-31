import { devToolingItems } from "../../date/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function DevToolingSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={devToolingItems} /></section>);
}
