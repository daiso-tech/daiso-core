import { foundationRuntimeItems } from "../../data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function FoundationRuntimeSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={foundationRuntimeItems} /></section>);
}
