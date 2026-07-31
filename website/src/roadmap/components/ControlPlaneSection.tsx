import { CONTROL_PLANE_ITEMS } from "../../data/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function ControlPlaneSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={CONTROL_PLANE_ITEMS} /></section>);
}
