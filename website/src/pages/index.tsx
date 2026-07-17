import { SiTypescript, SiVitest } from "@icons-pack/react-simple-icons";
import {
    Package,
    ShieldCheck,
    Lock,
    Database,
    HardDrive,
    Radio,
    Layers,
    Users,
    Webhook,
    CircuitBoard,
    ArrowLeftRight,
    List,
    ArrowRight,
    Zap,
    Plug,
    Share2,
    Copy,
    Check,
    Star,
    Clock,
    Bell,
    Box,
    Search,
    Globe,
    GitBranch,
    Lightbulb,
    Server,
    Key,
} from "lucide-react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { type ReactNode, useState, useCallback } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";

const INSTALL_CMD = "npm install @daiso-tech/core";

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
                    <StatItem value="10+" label="Battle-tested components" />
                    <StatItem value="100%" label="TypeScript" />
                    <StatItem value="4+" label="Adapters per component" />
                    <StatItem value="0" label="Docker needed for tests" />
                </div>
            </div>
        </div>
    );
}

// --- Features ---

type FeatureItemProps = {
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
};

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
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Why @daiso-tech/core?
                    </h2>
                    <p className="daiso-section-subtitle">
                        Designed from the ground up for real-world backend
                        challenges.
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

// --- Components ---

type ComponentItemProps = {
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
    href?: string;
};

function ComponentItem(props: ComponentItemProps) {
    const card = (
        <div className="daiso-component-card card">
            <div className="card__header">
                <div className="daiso-component-icon">{props.icon}</div>
                <h3>{props.title}</h3>
            </div>
            <div className="card__body">
                <p>{props.description}</p>
            </div>
        </div>
    );
    return (
        <div className="col col--4 margin-bottom--lg">
            {props.href ? (
                <Link to={props.href} className="daiso-component-link">
                    {card}
                </Link>
            ) : (
                card
            )}
        </div>
    );
}

function ComponentSection({ items }: { items: ComponentItemProps[] }) {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">Components</h2>
                    <p className="daiso-section-subtitle">
                        A growing collection of officially maintained,
                        production-ready components. Every component ships with
                        multiple built-in adapters — swap infrastructure without
                        changing a single line of business logic.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <ComponentItem key={idx} {...item} />
                    ))}
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

function UpcomingSection({ items }: { items: ComponentItemProps[] }) {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        🔮 Upcoming Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        Components currently in design or development — not yet
                        available in any release.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <ComponentItem key={idx} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Vision ---

type VisionItemProps = {
    title: string;
    comingSoon?: boolean;
    description: ReactNode;
};

function VisionItem({ title, comingSoon, description }: VisionItemProps) {
    return (
        <div className="col col--6 margin-bottom--lg">
            <div className="daiso-feature-card" style={{ height: "100%" }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p style={{ margin: 0 }}>{description}</p>
            </div>
        </div>
    );
}

function VisionSection({ items }: { items: VisionItemProps[] }) {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">🌟 Vision</h2>
                    <p
                        className="daiso-section-subtitle"
                        style={{ textAlign: "left" }}
                    >
                        @daiso-tech/core will be built around one core idea:{" "}
                        <strong>
                            production-grade backend primitives that work great
                            standalone, but are even better together
                        </strong>{" "}
                        — all inside your existing fullstack TypeScript app.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <VisionItem key={idx} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Data ---

const featureItems: FeatureItemProps[] = [
    {
        icon: <SiTypescript size="1.5rem" />,
        title: "Type safe by default",
        description:
            "Full TypeScript support with precise generics, rich intellisense, and auto-import friendly APIs — errors caught at compile time, not runtime.",
    },
    {
        icon: <Package size="1.5rem" strokeWidth={1.5} />,
        title: "ESM ready",
        description:
            "Built on modern JavaScript primitives including ES modules. No CommonJS baggage — fully compatible with the modern Node.js and bundler ecosystem.",
    },
    {
        icon: <SiVitest size="1.5rem" />,
        title: "Easily testable",
        description:
            "Every component ships with an in-memory adapter and built-in Vitest helpers. Write fast, isolated tests without Docker or external services.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Standard schema support",
        description: (
            <>
                First-class integration with{" "}
                <a href="https://standardschema.dev/">Standard Schema</a>. Use{" "}
                <a href="https://zod.dev/">Zod</a>, Valibot, or ArkType to
                enforce both compile-time and runtime data safety.
            </>
        ),
    },
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Framework agnostic",
        description:
            "No DI container required. Plug directly into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.",
    },
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Adapter pattern",
        description:
            "Swap infrastructure at will — Redis today, DynamoDB tomorrow. The adapter pattern keeps your business logic free from vendor lock-in.",
    },
];

const componentItems: ComponentItemProps[] = [
    {
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: "Cache",
        description:
            "Speed up your application by storing frequently accessed data in a pluggable cache store — Memory, Redis, Kysely, and MongoDB adapters included.",
        href: "/docs/components/cache/cache_usage",
    },
    {
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: "File storage",
        description:
            "Manage files with a unified API across local filesystem, in-memory, and cloud providers like AWS S3.",
        href: "/docs/components/file_storage/file_storage_usage",
    },
    {
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: "EventBus",
        description:
            "Publish and subscribe to events across distributed server instances or entirely in-memory for local testing.",
        href: "/docs/components/event_bus/event_bus_usage",
    },
    {
        icon: <CircuitBoard size="1.5rem" strokeWidth={1.5} />,
        title: "Circuit-breaker",
        description:
            "Prevent cascading failures with an automatic circuit-breaker primitive that stops calls to a consistently failing service.",
        href: "/docs/components/circuit_breaker/circuit_breaker_usage",
    },
    {
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: "Lock",
        description:
            "Guarantee mutual exclusion across multiple processes with a distributed lock, eliminating race conditions on shared resources.",
        href: "/docs/components/lock/lock_usage",
    },
    {
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: "Semaphore",
        description:
            "Limit concurrent access to a resource or code section across processes with a configurable distributed semaphore.",
        href: "/docs/components/semaphore/semaphore_usage",
    },
    {
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: "Shared lock",
        description:
            "Coordinate readers and writers efficiently — allow concurrent reads while ensuring exclusive, safe writes across processes.",
        href: "/docs/components/shared_lock/shared_lock_usage",
    },
    {
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: "Serde",
        description:
            "Add custom serialization and deserialization logic that integrates transparently with every other component in the library.",
        href: "/docs/components/serde",
    },
    {
        icon: <List size="1.5rem" strokeWidth={1.5} />,
        title: "Collection",
        description:
            "Effortlessly work with Arrays, Iterables, and AsyncIterables using a rich, composable, and lazy collection API.",
        href: "/docs/components/collection",
    },
    {
        icon: <Webhook size="1.5rem" strokeWidth={1.5} />,
        title: "Middleware",
        description:
            "Intercept and compose any sync or async function with a priority-based middleware pipeline. Built-in retry, fallback, and timeout middlewares for handling transient failures.",
        href: "/docs/components/middleware",
    },
    {
        icon: <Share2 size="1.5rem" strokeWidth={1.5} />,
        title: "Execution context",
        description:
            "Propagate request-scoped data — user info, trace IDs, tenant context — across async boundaries. Integrates transparently with all components and adapters.",
        href: "/docs/components/execution_context",
    },
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Resilience",
        description:
            "Robust async flows with built-in middlewares: retry, fallback, and timeout for reliability and fault tolerance.",
        href: "/docs/components/resilience",
    },
    {
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: "Typed config access",
        description:
            "ConfigAccessor reads typed application config values through a small accessor with optional schema validation.",
        href: "/docs/components/config_accessor",
    },
    {
        icon: <Key size="1.5rem" strokeWidth={1.5} />,
        title: "Typed env access",
        description:
            "EnvAccessor loads and validates environment variables from one or more sources with type-safe access.",
        href: "/docs/components/env_accessor",
    },
    {
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: "HTTP Router",
        description:
            "Route HTTP requests with a universal WinterTC-compatible fetch handler. Works with any framework or runtime that is WinterTC-compatible like Cloudflare Workers, AWS Lambda (via Hono), Next.js and more.",
          href: "/docs/components/http_router",
    },
];

const upcomingItems: ComponentItemProps[] = [
    {
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: "Job scheduler",
        description:
            "Schedule work with full flexibility — immediate dispatch, delayed execution, and recurring jobs.",
    },
    {
        icon: <GitBranch size="1.5rem" strokeWidth={1.5} />,
        title: "Structured cancellations",
        description:
            "Planning to support running async tasks in structured scopes where child tasks are tied to their parent's lifetime — with automatic cancellation, error propagation, and resource cleanup.",
    },
    {
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: "Promise queue",
        description:
            "Planning to add a configurable promise queue to control the number of concurrently executing promises and prevent resource exhaustion.",
    },
    {
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: "DI container",
        description:
            "Planning to build a lightweight, type-safe dependency injection container for wiring application components without tight coupling.",
    },
    {
        icon: <Bell size="1.5rem" strokeWidth={1.5} />,
        title: "Notifications",
        description:
            "Planning to support sending notifications through multiple channels — synchronous dispatching, immediate enqueueing, delayed enqueueing, and recurring messages. Planned adapters include Slack, Discord, email, SMS, and WebSocket (browser push).",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Transaction context",
        description:
            "Planning to support coordinating database transactions across components with the after-commit, outbox, and inbox patterns for reliable, exactly-once message delivery.",
    },
    {
        icon: <Copy size="1.5rem" strokeWidth={1.5} />,
        title: "Idempotent cache",
        description:
            "Planning to add built-in idempotency support for the Job Scheduler and Event Bus to prevent duplicate job execution and event processing.",
    },
    {
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: "MikroORM",
        description: (
            <>
                Planning first-class integration with{" "}
                <a href="https://mikro-orm.io/">MikroORM</a> as the primary
                database layer — full ORM support across PostgreSQL, MongoDB,
                SQLite, and more, with deep integration across all components.
            </>
        ),
    },
    {
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: "Text search",
        description:
            "Planning to support synchronising your database — synchronously or asynchronously — with an external search engine via a unified interface. First-class integrations with MikroORM, PostgreSQL (via Kysely), and MongoDB planned.",
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "OpenAPI",
        description:
            "Planning first-class OpenAPI support — define your API schema alongside your handlers and get spec generation, validation, and documentation out of the box.",
    },
    {
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: "Session management",
        description:
            "Planning to support managing user sessions securely with a pluggable, adapter-driven API.",
    },
    {
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: "Authorization gates",
        description:
            "Planning to implement gate primitives for fine-grained, policy-based access control.",
    },
    {
        icon: <Lightbulb size="1.5rem" strokeWidth={1.5} />,
        title: "Apache Casbin integration",
        description: (
            <>
                Planning integration with{" "}
                <a href="https://casbin.org/">Casbin</a> for advanced
                authorization using attribute-based, role-based, and
                relationship-based access control models.
            </>
        ),
    },
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Authentication",
        description: (
            <>
                Planning first-class support for username/password, email
                verification, OAuth, and WebAuthn — with a{" "}
                <a href="https://www.better-auth.com/">Better Auth</a>{" "}
                integration for batteries-included setups.
            </>
        ),
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>Logging &amp; OpenTelemetry</>,
        description: (
            <>
                Planned support for flexible logging and{" "}
                <a href="https://opentelemetry.io/">OpenTelemetry</a>{" "}
                integration to make debugging and observability seamless.
            </>
        ),
    },
];

const visionItems: VisionItemProps[] = [
    {
        title: "Composable by design, not by requirement",
        description:
            "Every component will be self-contained and will have zero hard dependencies on the others. You will be able to drop the Cache, the Lock, or the EventBus into any project in isolation. But when you use them together, they will integrate seamlessly — sharing the same execution context, serde layer, adapters, and conventions without any extra wiring.",
    },
    {
        title: "No DI container required — but supported when you want it",
        comingSoon: true,
        description:
            "Components will remain plain classes you instantiate yourself. There will be no forced dependency injection framework. The DI container will become a first-class citizen that understands every component in the library — so when you do want a container, it will work with no adapters and no boilerplate.",
    },
    {
        title: "One server, one app",
        description: (
            <>
                The library's HTTP primitives will be built on the standard Web
                platform <code>Request</code>/<code>Response</code> API, which
                will allow your route handlers to run natively inside{" "}
                <strong>
                    Next.js, SvelteKit, Nuxt, SolidStart, Analog (Angular),
                    TanStack Start, Cloudflare Workers, Vercel Functions,
                    Netlify Functions, and many more platforms via Hono
                </strong>{" "}
                — with no separate backend server to host, deploy, or maintain.
                Your fullstack app will become your backend.
            </>
        ),
    },
    {
        title: "A cohesive experience for the JavaScript ecosystem",
        description:
            "The long-term vision will be to give TypeScript developers a cohesive, batteries-included experience — authentication, authorization, job scheduling, notifications, queues, caching, file storage, and more — designed from the ground up for the modern JavaScript fullstack world. There will be no framework lock-in, no vendor lock-in, just great primitives that fit together.",
    },
    {
        title: "The framework experience",
        description: (
            <>
                On top of the agnostic core, a separate opinionated,
                batteries-included framework layer will be introduced. Unlike
                the core library, it will not be agnostic — it will make
                deliberate choices so you will not have to. It will be delivered
                as a <strong>Vite plugin</strong> that can be dropped into most
                modern frontend frameworks — Next.js, SvelteKit, Nuxt,
                SolidStart, TanStack Start, Analog, and more — and will lean
                heavily on <strong>code generation</strong> to eliminate
                boilerplate, auto-wire components, and provide a truly
                integrated developer experience with a
                convention-over-configuration feel directly inside your existing
                fullstack app.
            </>
        ),
    },
];

// --- Page ---

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <header className="daiso-hero hero hero--primary">
                <div className="container">
                    <p className="daiso-hero-badge margin-bottom--md">
                        Backend server SDK for TypeScript
                    </p>
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    <p className="hero__subtitle daiso-hero-tagline">
                        {siteConfig.tagline}
                    </p>
                    <p className="daiso-hero-subtext">
                        The library contains 4,640 tests — the majority are
                        integration and behavior tests, ensuring reliability in
                        real-world scenarios.
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
                <FeatureSection items={featureItems} />
                <ComponentSection items={componentItems} />
                <UpcomingSection items={upcomingItems} />
                <VisionSection items={visionItems} />
                <GitHubStarBanner />
                <CtaSection />
            </main>
        </Layout>
    );
}
