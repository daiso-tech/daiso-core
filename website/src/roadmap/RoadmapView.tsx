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
} from "./index";
import type { ComponentItemProps } from "./index";
import {
  CheckCircle,
  Box,
  RefreshCw,
  Server,
  Lock,
  Puzzle,
  Wrench,
  Layers,
} from "lucide-react";
import Link from "@docusaurus/Link";
import styles from "./roadmap.module.css";

const sectionConfig: {
  heading: string;
  items: ComponentItemProps[];
  icon: React.ReactNode;
  description?: string;
}[] = [
  {
    heading: "Foundation & Runtime",
    items: foundationRuntimeItems,
    icon: <Box size="1.15rem" strokeWidth={2} />,
    description: "The core structural building blocks — DI, execution control, and transaction orchestration.",
  },
  {
    heading: "Reliability & Messaging",
    items: reliabilityMessagingItems,
    icon: <RefreshCw size="1.15rem" strokeWidth={2} />,
    description: "Guaranteed message delivery, job scheduling, and idempotency — built on Transaction Context.",
  },
  {
    heading: "Security",
    items: securityItems,
    icon: <Lock size="1.15rem" strokeWidth={2} />,
    description: "Authentication, authorization, and session management — end-to-end security.",
  },
  {
    heading: "Integrations",
    items: integrationsItems,
    icon: <Puzzle size="1.15rem" strokeWidth={2} />,
    description: "Connect Daiso to the rest of your stack — search engines, ORMs, and API specifications.",
  },
  {
    heading: "Dev Tooling",
    items: devToolingItems,
    icon: <Wrench size="1.15rem" strokeWidth={2} />,
    description: "Plugins, autodiscovery, and runtime introspection — everything you need to build with Daiso.",
  },
];

function AvailableCategory({ label, items }: { label: string; items: ComponentItemProps[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h4 style={{ fontSize: "0.82rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--ifm-color-emphasis-600)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</h4>
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

function AvailableToday() {
  const total = foundationExistingItems.length + storageExistingItems.length + reliabilityExistingItems.length + concurrencyExistingItems.length + messagingExistingItems.length + webExistingItems.length;

  return (
    <section className={styles.availableSection}>
      <div className={styles.availableHeader}>
        <span className={styles.availableIcon}>
          <CheckCircle size="1.2rem" strokeWidth={2.5} />
        </span>
        <h2 className={styles.availableTitle}>Available Today</h2>
      </div>
      <p className={styles.availableSubtitle}>
        The Daiso ecosystem already ships <strong>{total} ready components</strong> —
        tested, fully documented, and available now.
      </p>

      <AvailableCategory label="Foundation" items={foundationExistingItems} />
      <AvailableCategory label="Storage" items={storageExistingItems} />
      <AvailableCategory label="Reliability" items={reliabilityExistingItems} />
      <AvailableCategory label="Concurrency" items={concurrencyExistingItems} />
      <AvailableCategory label="Messaging" items={messagingExistingItems} />
      <AvailableCategory label="Web" items={webExistingItems} />
    </section>
  );
}

function ArchitectureOverview() {
  return (
    <div className={styles.architectureBox}>
      <h3 className={styles.architectureTitle}>How the ecosystem fits together</h3>
      <p className={styles.architectureDesc}>
        Every planned component plugs into an existing layer — nothing is built in isolation.
      </p>
      <div className={styles.architectureLayers}>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Layers size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Foundation</span>
          <span className={styles.archLayerComponents}>Middleware · Serde · Execution Context · Config · DI</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><RefreshCw size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Reliability</span>
          <span className={styles.archLayerComponents}>Cache · Circuit Breaker · Locks · Scheduler · Outbox/Inbox</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Lock size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Security</span>
          <span className={styles.archLayerComponents}>Authentication · Authorization · Sessions</span>
        </div>
        <div className={styles.archLayer}>
          <span className={styles.archLayerIcon}><Puzzle size="0.9rem" strokeWidth={2} /></span>
          <span className={styles.archLayerLabel}>Integrations</span>
          <span className={styles.archLayerComponents}>OpenAPI · Search · MikroORM · Notifications</span>
        </div>
      </div>
    </div>
  );
}

function FutureSection({ section }: { section: typeof sectionConfig[number] }) {
  return (
    <section className={styles.futureSection}>
      <div className={styles.futureHeader}>
        <span className={styles.sectionIcon}>{section.icon}</span>
        <div>
          <h2 className={styles.sectionHeading}>{section.heading}</h2>
          {section.description && (
            <p style={{ fontSize: "0.82rem", color: "var(--ifm-color-emphasis-500)", margin: "0.05rem 0 0", lineHeight: 1.4 }}>
              {section.description}
            </p>
          )}
        </div>
      </div>
      <div className={styles.futureContent}>
        <div className={styles.availableGrid}>
          {section.items.map((item, i) => (
            <div key={i} className={styles.plannedCard}>
              <span className={styles.plannedCardIcon}>{item.icon}</span>
              <div className={styles.plannedCardBody}>
                <div className={styles.plannedCardTitle}>{item.title}</div>
                <p className={styles.plannedCardDesc}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoadmapView() {
  return (
    <>
      <AvailableToday />
      <ArchitectureOverview />
      {sectionConfig.map((section, si) =>
        section.items.length > 0 && (
          <FutureSection key={si} section={section} />
        ),
      )}
    </>
  );
}
