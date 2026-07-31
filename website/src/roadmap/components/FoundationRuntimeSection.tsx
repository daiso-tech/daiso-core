import { FOUNDATION_RUNTIME_ITEMS } from "../../data/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function FoundationRuntimeSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={FOUNDATION_RUNTIME_ITEMS} /></section>);
}
