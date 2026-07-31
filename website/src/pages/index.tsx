import {
    UPCOMING_ITEMS,
    FOUNDATION_EXISTING_ITEMS,
    STORAGE_EXISTING_ITEMS,
    RELIABILITY_EXISTING_ITEMS,
    CONCURRENCY_EXISTING_ITEMS,
    MESSAGING_EXISTING_ITEMS,
    WEB_EXISTING_ITEMS,
    FEATURE_ITEMS,
    PERFECT_FOR,
    NOT_IDEAL_FOR,
    CODE_EXAMPLES,
    INSTALL_CMD,
} from "../data/data";
import type { FeatureItemProps, CodeExample, CodeFile } from "../data/types";
import { AvailableCategory } from "../roadmap/components/AvailableCategory";
import { PlannedCardGrid } from "../roadmap/components/PlannedCardGrid";
import {
    ShieldCheck,
    ArrowRight,
    Zap,
    Plug,
    Package,
    Copy,
    Check,
    Star,
} from "lucide-react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { type ReactNode, useState, useCallback } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

function InstallCommand() {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        void navigator.clipboard.writeText(INSTALL_CMD).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, []);
    return (
        <div className="daiso-install-command">
            <code>{INSTALL_CMD}</code>
            <button
                className="daiso-copy-btn"
                onClick={copy}
                aria-label="Copy install command"
                title={copied ? "Copied!" : "Copy"}
            >
                {copied ? (
                    <Check size="1rem" strokeWidth={2.5} />
                ) : (
                    <Copy size="1rem" strokeWidth={2} />
                )}
            </button>
        </div>
    );
}

// --- Stats bar ---

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="daiso-stat-item">
            <span className="daiso-stat-value">{value}</span>
            <span className="daiso-stat-label">{label}</span>
        </div>
    );
}

function StatsBar() {
    return (
        <div className="daiso-stats-bar">
            <div className="container">
                <div className="daiso-stats-inner">
                    <StatItem value="17" label="Officially maintained components" />
                    <StatItem value="100%" label="TypeScript" />
                    <StatItem
                        value="4,640+"
                        label="Integration & behavior tests"
                    />
                    <StatItem value="0" label="Docker needed for tests" />
                </div>
            </div>
        </div>
    );
}

function CodeShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const codeExamples = Object.values(CODE_EXAMPLES);

    const goTo = useCallback(
        (index: number) => {
            if (index === activeIndex) return;
            setFading(true);
            setTimeout(() => {
                setActiveIndex(index);
                setFading(false);
            }, 180);
        },
        [activeIndex],
    );

    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div
                    className="daiso-section-header"
                    style={{
                        alignItems: "center",
                        justifyContent: "start",
                        gap: "3rem",
                    }}
                >
                    <h2 className="daiso-section-title">
                        Unified architecture
                    </h2>
                    <div className="daiso-segmented-control">
                        {codeExamples.map((ex, i) => (
                            <button
                                key={i}
                                className={`daiso-segmented-option${i === activeIndex ? " daiso-segmented-option--active" : ""}`}
                                onClick={() => goTo(i)}
                            >
                                {ex.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="row">
                    <div className="col col--5">
                        <div
                            className={`daiso-carousel-text${fading ? " daiso-carousel-text--fading" : ""}`}
                        >
                            <h3
                                className="daiso-section-subtitle"
                                style={{
                                    textAlign: "left",
                                    fontWeight: 700,
                                    color: "var(--ifm-color-emphasis-900)",
                                    fontSize: "1.25rem",
                                }}
                            >
                                {codeExamples[activeIndex].heading}
                            </h3>
                            <p
                                className="daiso-section-subtitle"
                                style={{
                                    margin: "0 0 1.25rem",
                                    textAlign: "left",
                                }}
                            >
                                {codeExamples[activeIndex].description}
                            </p>
                            <ul className="daiso-check-list">
                                {codeExamples[activeIndex].bullets.map(
                                    (b, i) => (
                                        <li key={i}>
                                            <Check
                                                size="1rem"
                                                strokeWidth={2.5}
                                            />{" "}
                                            {b}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="col col--7">
                        {codeExamples[activeIndex].codeBlockDescription && (
                            <p className="daiso-carousel-description">
                                {
                                    codeExamples[activeIndex]
                                        .codeBlockDescription
                                }
                            </p>
                        )}
                        <div className="daiso-carousel">
                            <div
                                className={`daiso-carousel-body${fading ? " daiso-carousel-body--fading" : ""}`}
                            >
                                <Tabs key={activeIndex}>
                                    {codeExamples[activeIndex].files.map(
                                        (file, i) => (
                                            <TabItem
                                                key={i}
                                                value={file.name}
                                                label={file.name}
                                            >
                                                <CodeBlock language="typescript">
                                                    {file.code}
                                                </CodeBlock>
                                            </TabItem>
                                        ),
                                    )}
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeatureItem(props: FeatureItemProps) {
    return (
        <div className="col col--6 margin-bottom--lg">
            <div className="daiso-feature-card">
                <div className="daiso-feature-icon">{props.icon}</div>
                <h3>{props.title}</h3>
                <p>{props.description}</p>
            </div>
        </div>
    );
}

function FeatureSection({ items }: { items: FeatureItemProps[] }) {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Why @daiso-tech/core?
                    </h2>
                    <p className="daiso-section-subtitle">
                        Designed from the ground up for real-world backend
                        challenges — no vendor lock-in, no Docker required for
                        testing, no DI container overhead.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <FeatureItem key={idx} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function WhoIsThisFor() {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">Who is this for?</h2>
                    <p className="daiso-section-subtitle">
                        @daiso-tech/core is built for backend and fullstack
                        TypeScript developers who value flexibility and
                        testability.
                    </p>
                </div>
                <div
                    className="row"
                    style={{
                        justifyContent: "stretch",
                        alignItems: "start",
                    }}
                >
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-yes">
                            <h3>
                                <Check
                                    size="1.25rem"
                                    strokeWidth={2.5}
                                    style={{
                                        marginRight: "0.5rem",
                                        verticalAlign: "middle",
                                        color: "var(--ifm-color-primary)",
                                    }}
                                />
                                Perfect for
                            </h3>
                            <ul className="daiso-who-list">
                                {Object.values(PERFECT_FOR).map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.title}</strong>{" "}
                                        {item.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-no">
                            <h3>
                                <Star
                                    size="1.25rem"
                                    strokeWidth={2}
                                    style={{
                                        marginRight: "0.5rem",
                                        verticalAlign: "middle",
                                        opacity: 0.7,
                                    }}
                                />
                                Not ideal for
                            </h3>
                            <ul className="daiso-who-list">
                                {Object.values(NOT_IDEAL_FOR).map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.title}</strong>{" "}
                                        {item.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Components (Available Today) ---

function ComponentSection() {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Officially Maintained Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        A growing collection of officially maintained
                        components. Every component ships with multiple built-in
                        adapters — swap infrastructure without changing a single
                        line of business logic.
                    </p>
                </div>
                <AvailableCategory
                    label="Foundation"
                    items={FOUNDATION_EXISTING_ITEMS}
                />
                <AvailableCategory
                    label="Storage"
                    items={STORAGE_EXISTING_ITEMS}
                />
                <AvailableCategory
                    label="Resilience"
                    items={RELIABILITY_EXISTING_ITEMS}
                />
                <AvailableCategory
                    label="Concurrency"
                    items={CONCURRENCY_EXISTING_ITEMS}
                />
                <AvailableCategory
                    label="Messaging"
                    items={MESSAGING_EXISTING_ITEMS}
                />
                <AvailableCategory label="Web" items={WEB_EXISTING_ITEMS} />
                <div className="text--center margin-top--lg">
                    <Link
                        className="button button--outline button--secondary"
                        to="/docs/components/collection"
                    >
                        View all component docs{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- GitHub star banner ---

function GitHubStarBanner() {
    return (
        <section className="daiso-star-banner padding-vert--lg">
            <div className="container text--center">
                <Star
                    size="2rem"
                    className="daiso-star-icon"
                    strokeWidth={1.5}
                />
                <h2 className="daiso-star-title">
                    Find this library useful? Give it a ⭐
                </h2>
                <p className="daiso-star-subtitle">
                    If you see potential in @daiso-tech/core, starring the repo
                    on GitHub helps others discover it and motivates continued
                    development. It takes one click and means a lot.
                </p>
                <Link
                    className="button button--primary button--lg"
                    href="https://github.com/daiso-tech/daiso-core"
                >
                    <Star
                        size="1rem"
                        style={{
                            marginRight: "0.5rem",
                            verticalAlign: "middle",
                        }}
                        strokeWidth={2}
                    />
                    Star on GitHub
                </Link>
            </div>
        </section>
    );
}

// --- CTA ---

function CtaSection() {
    return (
        <section className="daiso-cta-section padding-vert--xl">
            <div className="container text--center">
                <h2>Ready to build something great?</h2>
                <p className="daiso-cta-subtitle">
                    Get up and running in minutes with a single install.
                </p>
                <div className="margin-bottom--lg">
                    <InstallCommand />
                </div>
                <div className="daiso-hero-ctas">
                    <Link
                        className="button button--secondary button--lg"
                        to="./docs/installation"
                    >
                        Get started{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                    <Link
                        className="button button--outline button--secondary button--lg"
                        href="https://github.com/daiso-tech/daiso-core"
                    >
                        View on GitHub
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- Upcoming Components ---

function UpcomingSection() {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        🔮 Upcoming Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        Components currently in design or development — not yet
                        available in any release.
                    </p>
                </div>
                <PlannedCardGrid items={UPCOMING_ITEMS} />
                <div className="text--center margin-top--lg">
                    <Link
                        className="button button--outline button--secondary"
                        to="/docs/roadmap"
                    >
                        View full roadmap{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- Framework Comparison ---

function FrameworkComparison() {
    const [activeIndex, setActiveIndex] = useState(0);

    const comparisons = [
        {
            label: "Vendor lock-in",
            heading: "Swap infrastructure without rewriting code.",
            instead:
                "Tied to a specific vendor (Redis, S3). Changing a vendor means rewriting integration code — your cache, lock, or file storage logic is coupled to a specific provider.",
            daiso: "Adapter pattern built into every component. Swap Redis ↔ Postgres ↔ S3 ↔ in-memory anytime — zero changes to your application logic. The same API works across all backends.",
        },
        {
            label: "DI container",
            heading: "Optional DI. Not forced.",
            instead:
                "DI container required (NestJS, Inversify). Every service must be registered in a module, decorated, and injected through the framework's DI system — adding boilerplate and framework coupling.",
            daiso: "Plain TypeScript classes — instantiate directly with `new` or a factory function. No decorators, no modules, no forced DI. Use a container when you want one, not because you have to.",
        },
        {
            label: "Testing",
            heading: "Zero-dependency integration tests.",
            instead:
                "Docker required for integration tests. Want to test with Redis or S3? Spin up containers, wait for them to be ready, and clean up after — slowing down every test run.",
            daiso: "In-memory adapters built into every component. Your test suite runs without Docker, without external services, without network calls. Same API, same assertions, instant feedback.",
        },
        {
            label: "Learning curve",
            heading: "One API. Every component.",
            instead:
                "Different APIs for each library. Redis has one client API, S3 has another, Bull has its own, node-cron has yet another — your team must learn and maintain each one.",
            daiso: "Unified `createX` pattern across all components. Cache, Lock, Event Bus, File Storage, Scheduler — all share the same conventions, adapter interfaces, and configuration style.",
        },
        {
            label: "Wiring",
            heading: "Seamless integration, zero glue code.",
            instead:
                "Wiring libraries together manually. Need caching + locking + event bus? Import each library, configure each separately, and write adapter code to connect them yourself.",
            daiso: "Components integrate seamlessly out of the box. Shared execution context, serde layer, adapter conventions — use two components or ten, they just work together.",
        },
        {
            label: "Frameworks",
            heading: "Works with everything. Locks you into nothing.",
            instead:
                "Framework-specific solutions. NestJS decorators don't work in Express. Express middleware doesn't work in Fastify. Choose a framework and you're locked into its ecosystem.",
            daiso: "Framework agnostic. Same components work in Express, Fastify, Hono, Next.js, Nuxt, NestJS, or any Node.js server — no framework-specific wrappers or adapters needed.",
        },
    ];

    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        How @daiso-tech/core compares
                    </h2>
                    <p className="daiso-section-subtitle">
                        A library, not a framework — @daiso-tech/core gives you
                        backend primitives that plug into whatever you're
                        already using, without taking over your architecture.
                    </p>
                </div>
                <div className="daiso-segmented-control-wrapper">
                    <div className="daiso-segmented-control">
                        {comparisons.map((comp, i) => (
                            <button
                                key={comp.label}
                                className={`daiso-segmented-option${i === activeIndex ? " daiso-segmented-option--active" : ""}`}
                                onClick={() => setActiveIndex(i)}
                            >
                                {comp.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="row">
                    <div className="col col--6">
                        <div className="daiso-carousel-text">
                            <h2 className="daiso-section-title">
                                {comparisons[activeIndex].heading}
                            </h2>
                            <div className="daiso-comparison-sides">
                                <div className="daiso-comp-instead">
                                    <div className="daiso-comp-label-instead">
                                        Instead of
                                    </div>
                                    <p>{comparisons[activeIndex].instead}</p>
                                </div>
                                <div className="daiso-comp-daiso">
                                    <div className="daiso-comp-label-daiso">
                                        @daiso-tech/core
                                    </div>
                                    <p>{comparisons[activeIndex].daiso}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col col--6">
                        <div
                            className="daiso-carousel"
                            style={{ padding: "2rem" }}
                        >
                            <div className="daiso-carousel-body text--center">
                                <ShieldCheck
                                    size="3.5rem"
                                    strokeWidth={1.5}
                                    style={{
                                        color: "var(--ifm-color-primary)",
                                        marginBottom: "1rem",
                                    }}
                                />
                                <h3
                                    style={{
                                        margin: "0 0 0.75rem",
                                        fontWeight: 700,
                                        fontSize: "1.1rem",
                                    }}
                                >
                                    {activeIndex === 0 && "No vendor lock-in."}
                                    {activeIndex === 1 &&
                                        "No forced framework."}
                                    {activeIndex === 2 && "No Docker required."}
                                    {activeIndex === 3 &&
                                        "Learn once, use everywhere."}
                                    {activeIndex === 4 && "Plug and play."}
                                    {activeIndex === 5 &&
                                        "Bring your own server."}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "var(--ifm-color-emphasis-600)",
                                        lineHeight: 1.6,
                                        margin: 0,
                                    }}
                                >
                                    {activeIndex === 0 &&
                                        "Switch between Redis, S3, Postgres, or in-memory without changing a single line of business logic."}
                                    {activeIndex === 1 &&
                                        "Use plain classes, factory functions, or your preferred DI container — @daiso-tech/core doesn't care."}
                                    {activeIndex === 2 &&
                                        "Every component ships with an in-memory adapter so you can test without Docker, without mocks, without waiting."}
                                    {activeIndex === 3 &&
                                        "The same `createX` pattern, the same adapter interface, the same configuration — across 17+ components."}
                                    {activeIndex === 4 &&
                                        "Execution Context, Serde, and adapter conventions are shared across all components — no glue code needed."}
                                    {activeIndex === 5 &&
                                        "Works with Express, Fastify, Hono, Next.js, Nuxt, NestJS — and every other Node.js framework or server."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Page ---

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <header className="daiso-hero hero hero--primary">
                <div className="container">
                    <p className="daiso-hero-badge margin-bottom--md">
                        The adapter-first backend toolkit for TypeScript
                    </p>
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    <p className="hero__subtitle daiso-hero-tagline">
                        Write business logic once.
                        <br />
                        Replace infrastructure anytime.
                    </p>
                    <p className="daiso-hero-subtext">
                        Swap Redis, S3, Postgres, and more — without rewriting
                        your application. 4,640+ integration and behavior tests
                        ensure reliability in real-world scenarios.
                    </p>
                    <div className="margin-bottom--xl">
                        <InstallCommand />
                    </div>
                    <div className="daiso-hero-ctas">
                        <Link
                            className="button button--secondary button--lg"
                            to="./docs/installation"
                        >
                            Get started{" "}
                            <ArrowRight
                                size="1rem"
                                style={{
                                    marginLeft: "0.4rem",
                                    verticalAlign: "middle",
                                }}
                            />
                        </Link>
                        <Link
                            className="button button--outline button--secondary button--lg"
                            href="https://github.com/daiso-tech/daiso-core"
                        >
                            View on GitHub
                        </Link>
                    </div>
                </div>
            </header>

            <StatsBar />

            <main>
                <CodeShowcase />
                <FeatureSection items={Object.values(FEATURE_ITEMS)} />
                <WhoIsThisFor />
                <ComponentSection />
                <UpcomingSection />
                <FrameworkComparison />
                <GitHubStarBanner />
                <CtaSection />
            </main>
        </Layout>
    );
}
