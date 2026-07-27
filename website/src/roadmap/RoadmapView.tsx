import {
  foundationExistingItems,
  storageExistingItems,
  reliabilityExistingItems,
  concurrencyExistingItems,
  messagingExistingItems,
  webExistingItems,
  foundationRuntimeItems,
  reliabilityMessagingItems,
  securityItems,
  integrationsItems,
  devToolingItems,
  controlPlaneItems,
} from "./index";
import type { ComponentItemProps } from "./index";
import {
  Layers,
  RefreshCw,
  Lock,
  Radio,
  Globe,
} from "lucide-react";
import Link from "@docusaurus/Link";
import styles from "./roadmap.module.css";


function AvailableCategory({ label, items }: { label: string; items: ComponentItemProps[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--ifm-color-emphasis-600)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div className={styles.availableGrid}>
        {items.map((item, i) => {
          const card = (
            <div className={styles.availableCard}>
              <span className={styles.availableCardIcon}>{item.icon}</span>
              <div className={styles.availableCardBody}>
                <div className={styles.availableCardTitle}>
                  {item.title}
                  {item.maturity !== undefined && (
                    <span className={
                      item.maturity >= 95 ? styles.availableCardBadge :
                      item.maturity >= 85 ? styles.badgeNearStable :
                      styles.badgeExperimental
                    }>
                      {item.maturity >= 95 ? "Stable" : item.maturity >= 85 ? "Near-stable" : "Experimental"}
                    </span>
                  )}
                </div>
                <p className={styles.availableCardDesc}>{item.description}</p>
              </div>
            </div>
          );
          return item.href ? (
            <Link key={i} to={item.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              {card}
            </Link>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

export function AvailableComponents() {
  return (
    <section className={styles.availableSection}>
      <AvailableCategory label="Foundation" items={foundationExistingItems} />
      <AvailableCategory label="Storage" items={storageExistingItems} />
      <AvailableCategory label="Resilience" items={reliabilityExistingItems} />
      <AvailableCategory label="Concurrency" items={concurrencyExistingItems} />
      <AvailableCategory label="Messaging" items={messagingExistingItems} />
      <AvailableCategory label="Web" items={webExistingItems} />
    </section>
  );
}

function PlannedCardGrid({ items }: { items: ComponentItemProps[] }) {
  return (
    <div className={styles.availableGrid}>
      {items.map((item, i) => (
        <div key={i} className={styles.plannedCard}>
          <span className={styles.plannedCardIcon}>{item.icon}</span>
          <div className={styles.plannedCardBody}>
            <div className={styles.plannedCardTitle}>{item.title}</div>
            <p className={styles.plannedCardDesc}>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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

export function FoundationRuntimeSection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={foundationRuntimeItems} />
    </section>
  );
}

export function ReliabilityMessagingSection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={reliabilityMessagingItems} />
    </section>
  );
}

export function SecuritySection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={securityItems} />
    </section>
  );
}

export function IntegrationsSection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={integrationsItems} />
    </section>
  );
}

export function DevToolingSection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={devToolingItems} />
    </section>
  );
}

export function ControlPlaneSection() {
  return (
    <section className={styles.futureSection}>
      <PlannedCardGrid items={controlPlaneItems} />
    </section>
  );
}
