import { Layers, RefreshCw, Lock, Radio, Globe } from "lucide-react";
import styles from "../roadmap.module.css";

export function ArchitectureOverview() {
  return (
    <div className={styles.architectureBox}>
      <div className={styles.architectureLayers}>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Layers size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Foundation</span>
          <span className={styles.archLayerComponents}>Middleware · Collection · Serde · Codec · Execution Context · Config · Env</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Globe size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Storage</span>
          <span className={styles.archLayerComponents}>Cache · File Storage</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><RefreshCw size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Resilience</span>
          <span className={styles.archLayerComponents}>Circuit Breaker · Rate Limiter · Resilience</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Lock size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Concurrency</span>
          <span className={styles.archLayerComponents}>Lock · Shared Lock · Semaphore</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Radio size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Messaging</span>
          <span className={styles.archLayerComponents}>Event Bus</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Globe size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Web</span>
          <span className={styles.archLayerComponents}>HTTP Router</span>
        </div>
      </div>
    </div>
  );
}
