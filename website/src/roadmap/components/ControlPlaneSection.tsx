import { controlPlaneItems } from "../index";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function ControlPlaneSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={controlPlaneItems} /></section>);
}
