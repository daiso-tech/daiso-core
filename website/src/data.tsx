import type { ReactNode } from "react";
import { SiTypescript, SiVitest } from "@icons-pack/react-simple-icons";
import {
    Box,
    ShieldCheck,
    Server,
    Clock,
    Layers,
    Bell,
    Users,
    Lock,
    Lightbulb,
    Plug,
    Search,
    Copy,
    Database,
    Send,
    Inbox,
    RefreshCw,
    Zap,
    Globe,
    HardDrive,
    Radio,
    CircuitBoard,
    ArrowLeftRight,
    List,
    Share2,
    GitBranch,
    Gauge,
    Terminal,
    MessageSquare,
    Reply,
    Leaf,
    Image,
    Activity,
    Package,
} from "lucide-react";

export const INSTALL_CMD = "npm install @daiso-tech/core";

export type ComponentItemProps = {
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
    href?: string;
    badges?: ReactNode[];
    subItems?: string[];
    maturity?: number;
    completedDate?: string;
};

// ─── Existing — Production-Ready Components ──────────────────────

export const foundationExistingItems: ComponentItemProps[] = [
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Middleware and AOP",
        href: "/docs/components/middleware",
        maturity: 90,
        description:
            "Composable middleware pipeline with before/after hooks, error handling, and context propagation — the foundation for every component's plugin system.",
    },
    {
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: "Collection",
        href: "/docs/components/collection",
        maturity: 90,
        description:
            "Type-safe collection utilities with powerful query, transform, and pagination primitives.",
    },
    {
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: "Serde",
        href: "/docs/components/serde",
        maturity: 80,
        description:
            "Serialize and deserialize data with fully type-safe schemas — the backbone for all data interchange across the ecosystem.",
    },
    {
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: "Codec",
        href: "/docs/components/codec",
        maturity: 80,
        description:
            "Encode and decode data across formats (JSON, Binary, etc.) with a unified, type-safe interface — build custom codecs for any protocol.",
    },
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Execution Context",
        href: "/docs/components/execution_context",
        maturity: 90,
        description:
            "Async context propagation for request-scoped state, dependency injection, and correlation IDs — without thread-local hacks.",
    },
    {
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: "Typed Config Access",
        href: "/docs/components/config_accessor",
        maturity: 90,
        description:
            "Safely read structured configuration from any source with runtime validation and full TypeScript inference.",
    },
    {
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: "Typed Env Access",
        href: "/docs/components/env_accessor",
        maturity: 90,
        description:
            "Type-safe environment variable access with parsing, defaults, and validation — never read process.env raw again.",
    },
];

export const storageExistingItems: ComponentItemProps[] = [
    {
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: "Cache",
        href: "/docs/components/cache/cache_usage",
        maturity: 90,
        description:
            "Multi-backend caching with pluggable stores (in-memory, Redis, etc.), TTL policies, and stampede protection.",
    },
    {
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: "File Storage",
        href: "/docs/components/file_storage/file_storage_usage",
        maturity: 90,
        description:
            "Abstract file storage with adapters for local disk, S3-compatible, and other backends — upload, stream, and serve with one API.",
    },
];

export const reliabilityExistingItems: ComponentItemProps[] = [
    {
        icon: <CircuitBoard size="1.5rem" strokeWidth={1.5} />,
        title: "Circuit Breaker",
        href: "/docs/components/circuit_breaker/circuit_breaker_usage",
        maturity: 90,
        description:
            "Prevent cascading failures with configurable thresholds, half-open recovery, and custom fallback strategies.",
    },
    {
        icon: <Gauge size="1.5rem" strokeWidth={1.5} />,
        title: "Rate Limiter",
        href: "/docs/components/rate-limiter/rate_limiter_usage",
        maturity: 90,
        description:
            "Throttle request rates with configurable limits, sliding windows, and pluggable backends — protect your services from overload.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Resilience",
        href: "/docs/components/resilience",
        maturity: 90,
        description:
            "Timeout, fallback, retry, with configurable policies and backoffs.",
    },
];

export const concurrencyExistingItems: ComponentItemProps[] = [
    {
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: "Lock",
        href: "/docs/components/lock/lock_usage",
        maturity: 90,
        description:
            "Distributed lock primitives with lease management, blocking and non-blocking acquisition, and automatic release.",
    },
    {
        icon: <Share2 size="1.5rem" strokeWidth={1.5} />,
        title: "Shared Lock",
        href: "/docs/components/shared_lock/shared_lock_usage",
        maturity: 90,
        description:
            "Read-write distributed locks for coordinating concurrent access with shared and exclusive modes.",
    },
    {
        icon: <List size="1.5rem" strokeWidth={1.5} />,
        title: "Semaphore",
        href: "/docs/components/semaphore/semaphore_usage",
        maturity: 90,
        description:
            "Rate-limit concurrent access to shared resources with dynamic permit allocation.",
    },
];

export const messagingExistingItems: ComponentItemProps[] = [
    {
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: "Event Bus",
        href: "/docs/components/event_bus/event_bus_usage",
        maturity: 90,
        description:
            "Pub/sub event bus with multiple transport backends, topic routing, and guaranteed delivery semantics.",
    },
];

export const webExistingItems: ComponentItemProps[] = [
    {
        icon: <GitBranch size="1.5rem" strokeWidth={1.5} />,
        title: "HTTP Router",
        href: "/docs/components/http_router/http_router_usage",
        maturity: 90,
        description:
            "Lightweight, composable HTTP router with middleware chains, parameter parsing, and framework-agnostic design.",
    },
];

export const existingItems: ComponentItemProps[] = [
    ...foundationExistingItems,
    ...storageExistingItems,
    ...reliabilityExistingItems,
    ...concurrencyExistingItems,
    ...messagingExistingItems,
    ...webExistingItems,
];

// ─── Foundation & Runtime ────────────────────────────────────────

export const foundationRuntimeItems: ComponentItemProps[] = [
    {
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: "DI Container",
        description:
            "A lightweight, type-safe dependency injection container for wiring application components without tight coupling.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Transaction Context",
        description:
            "Coordinate database transactions across components with the after-commit pattern. Foundation for reliable messaging — powers the Outbox, Inbox, Scheduler, and Notifications.",
    },
    {
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: "CLI Command",
        description:
            "A unified API for defining and executing CLI commands with a transport adapter architecture. Run commands locally via child processes, remotely over SSH or HTTP, inside Docker containers, or through custom transports — all from the same command definition.",
    },
    {
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: "Structured concurrency",
        description:
            "Run async tasks in structured scopes where child tasks are tied to their parent's lifetime — with automatic cancellation, error propagation, and resource cleanup.",
    },
    {
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: "Promise Queue",
        description:
            "A configurable promise queue to control the number of concurrently executing promises and prevent resource exhaustion.",
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "Logging & Observability",
        description: (
            <>
                Support for observability — logging, metrics, and tracing — with
                a pluggable adapter system. Pre-built adapters for{" "}
                <a href="https://opentelemetry.io/">OpenTelemetry</a> and a
                local adapter that saves logs, traces, and metrics to disk.
            </>
        ),
    },
    {
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: "Introspection",
        description:
            "Inspect the actual runtime state of any component through pre-built CLI commands — view registered handlers, active jobs, queue depth, lock holders, and more without digging into logs or metrics.",
    },
];

// ─── Reliability & Messaging ─────────────────────────────────────

export const reliabilityMessagingItems: ComponentItemProps[] = [
    {
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: "Job Scheduler",
        description:
            "Schedule work with full flexibility — immediate dispatch, delayed execution, and recurring jobs. Uses Transaction Context for reliable execution.",
    },
    {
        icon: <Bell size="1.5rem" strokeWidth={1.5} />,
        title: "Notifications",
        description:
            "Send notifications through multiple channels — synchronous dispatching, immediate enqueueing, delayed enqueueing, and recurring messages. Planned adapters include Slack, Discord, email, SMS, and WebSocket (browser push). Relies on Transaction Context and Scheduler.",
    },
    {
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: "Request Reply",
        description:
            "A request-reply messaging pattern for sending a message and awaiting a typed response. Supports timeouts, retries, and pluggable transport backends.",
    },
    {
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: "Message Queue",
        description:
            "A message queue abstraction with pluggable backends (in-memory, Redis, SQS, RabbitMQ) for reliable async communication between services.",
    },
    {
        icon: <Copy size="1.5rem" strokeWidth={1.5} />,
        title: "Idempotent Cache",
        description:
            "Built-in idempotency support for the Job Scheduler and Event Bus to prevent duplicate job execution and event processing.",
    },
    {
        icon: <Send size="1.5rem" strokeWidth={1.5} />,
        title: "Outbox Pattern",
        description:
            "The transactional outbox pattern to reliably publish messages and events as part of a database transaction. Works with Transaction Context.",
    },
    {
        icon: <Inbox size="1.5rem" strokeWidth={1.5} />,
        title: "Inbox Pattern",
        description:
            "The transactional inbox pattern to reliably process incoming messages and events with deduplication. Works with Transaction Context.",
    },
];

// ─── Security ────────────────────────────────────────────────────

export const securityItems: ComponentItemProps[] = [
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Authentication",
        description: (
            <>
                First-class support for username/password, email verification,
                OAuth, and WebAuthn — with a{" "}
                <a href="https://www.better-auth.com/">Better Auth</a>{" "}
                integration for batteries-included setups. Requires Sessions.
            </>
        ),
    },
    {
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: "Session Management",
        description:
            "Manage user sessions securely with a pluggable, adapter-driven API. Required by Authentication.",
    },
    {
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: "Authorization Gates",
        description:
            "Gate primitives for fine-grained, policy-based access control. Works alongside Authentication.",
    },
    {
        icon: <Lightbulb size="1.5rem" strokeWidth={1.5} />,
        title: "Apache Casbin Integration",
        description: (
            <>
                Integration with <a href="https://casbin.org/">Casbin</a> for
                advanced authorization using attribute-based, role-based, and
                relationship-based access control models.
            </>
        ),
    },
];

// ─── Integrations ────────────────────────────────────────────────

export const integrationsItems: ComponentItemProps[] = [
    {
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: "Text Search",
        description:
            "A pluggable text search abstraction with adapter support for Elasticsearch, SQL databases, and MongoDB. Integrates with MikroORM and other ORMs to automatically synchronise your data with search indexes — synchronously or asynchronously.",
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "OpenAPI",
        description:
        "First-class OpenAPI support — define your API schema alongside your handlers and get spec generation, validation, and documentation out of the box.",
    },
    {
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: "SQL Integration",
        description:
            "Pluggable SQL database adapters for Drizzle, Kysely, MikroORM, TypeORM, Sequelize, Knex, Prisma (SQL) and raw drivers. Internal SQL adapters abstract the database layer while using Kysely as a raw SQL query string builder — write queries once, run against any supported ORM or raw driver.",
    },
    {
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: "Mongoose and Native MongoDB Integration",
        description:
            "Native and performant MongoDB-backed implementations of every Daiso component — rate limiters, circuit breakers, event bus, message queues, job schedulers, request-reply, transaction context, and cache — all using MongoDB as the persistence layer. No additional dependencies required.",
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "PostgreSQL Native Integration",
        description:
            "Native and performant PostgreSQL-backed implementations of every Daiso component — rate limiters, circuit breakers, locks, semaphores, shared locks, event bus, message queues, job schedulers, request-reply, transaction context, and cache — all using PostgreSQL as the persistence layer via Kysely. No additional dependencies required.",
    },
    {
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: "SSH Deployment",
        description:
            "Deploy and manage Daiso applications on any VPS or bare-metal server via SSH. Push builds, manage processes, configure environment, and run health checks — all from a single CLI command, no Docker or orchestration required.",
    },
    {
        icon: <Image size="1.5rem" strokeWidth={1.5} />,
        title: "Image Manipulator",
        description:
            "A pluggable image manipulation component with adapter support for resize, crop, rotate, format conversion, and optimization — process images locally via Sharp or delegate to cloud services like Cloudinary and Imgix.",
    },
    {
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: "Process Manager",
        description:
            "Fork, monitor, and manage worker processes with automatic restart, health checks, log management, and graceful shutdown. Supports cluster mode and zero-downtime reload for Node.js applications.",
    },
];

// ─── Dev Tooling ─────────────────────────────────────────────────

export const devToolingItems: ComponentItemProps[] = [
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "DI Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers DI container modules — no manual import wiring required for new components or services.",
    },
    {
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: "Event Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers event bus handlers and listeners.",
    },
    {
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: "Job Scheduler Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers scheduled job definitions.",
    },
    {
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: "Request Reply Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers request-reply endpoints.",
    },
    {
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: "Message Queue Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers message queue consumers and handlers.",
    },
    {
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: "CLI Command Autodiscovery Vite Plugin",
        description:
            "A Vite plugin that automatically discovers and registers CLI command definitions.",
    },
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Scaffolding CLI",
        description:
            "Predefined CLI commands to scaffold Daiso projects and components. Initialize a new Daiso project from scratch or add individual components (DI, Cache, Scheduler, Auth, etc.) to an existing project — with sensible defaults, config files, and boilerplate code generated automatically.",
    },
];

// ─── Control Plane ──────────────────────────────────────────────

export const controlPlaneItems: ComponentItemProps[] = [
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "Daiso Platform",
        description:
            "A commercial control plane and runtime platform for deploying, managing, and monitoring Daiso-powered applications in production.",
    },
    {
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: "Dashboard & Observability",
        description:
            "Real-time dashboards for monitoring component health, job queues, event throughput, and system metrics across all Daiso services.",
    },
    {
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: "Multi-Tenancy",
        description:
            "Built-in tenant isolation, resource quotas, and per-tenant configuration for SaaS applications running on the Daiso platform.",
    },
];

// ─── Homepage preview subset ─────────────────────────────────────

export const upcomingItems: ComponentItemProps[] = [
    {
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: "DI Container",
        description:
            "A lightweight, type-safe dependency injection container for wiring application components without tight coupling.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Transaction Context",
        description:
            "Coordinate database transactions across components with the after-commit pattern. Foundation for reliable messaging — powers the Outbox, Inbox, Scheduler, and Notifications.",
    },
    {
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: "CLI Command",
        description:
            "A unified API for defining and executing CLI commands with a transport adapter architecture. Run commands locally via child processes, remotely over SSH or HTTP, inside Docker containers, or through custom transports — all from the same command definition.",
    },
    {
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: "Structured concurrency",
        description:
            "Run async tasks in structured scopes where child tasks are tied to their parent's lifetime — with automatic cancellation, error propagation, and resource cleanup.",
    },
    {
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: "Promise Queue",
        description:
            "A configurable promise queue to control the number of concurrently executing promises and prevent resource exhaustion.",
    },
    {
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: "Logging & Observability",
        description:
            "Support for observability — logging, metrics, and tracing — with a pluggable adapter system. Pre-built adapters for [OpenTelemetry](https://opentelemetry.io/) and a local adapter that saves logs, traces, and metrics to disk.",
    },
    {
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: "Introspection",
        description:
            "Inspect the actual runtime state of any component through pre-built CLI commands — view registered handlers, active jobs, queue depth, lock holders, and more without digging into logs or metrics.",
    },
    {
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: "Job Scheduler",
        description:
            "Schedule work with full flexibility — immediate dispatch, delayed execution, and recurring jobs. Uses Transaction Context for reliable execution.",
    },
];

// ─── Homepage Data ─────────────────────────────────────────────

export type FeatureItemProps = {
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
};

export const featureItems: FeatureItemProps[] = [
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Switch infrastructure without rewriting business logic",
        description:
            "The adapter pattern keeps your code decoupled from vendors. Use Redis today, Postgres tomorrow — no refactoring required.",
    },
    {
        icon: <SiVitest size="1.5rem" />,
        title: "Test everything without Docker",
        description:
            "Every component ships with an in-memory adapter and built-in Vitest helpers. Write fast, isolated tests — no external services needed.",
    },
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Bring your own framework",
        description:
            "No DI container required. Plug directly into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.",
    },
    {
        icon: <SiTypescript size="1.5rem" />,
        title: "Type-safe from day one",
        description:
            "Full TypeScript support with precise generics, rich intellisense, and auto-import friendly APIs — errors caught at compile time, not runtime.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Standard schema validation built in",
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
        icon: <Package size="1.5rem" strokeWidth={1.5} />,
        title: "ESM native. No CommonJS baggage.",
        description:
            "Built on modern JavaScript primitives. Fully compatible with Node.js, Bun, Deno, and the modern bundler ecosystem.",
    },
];

export type WhoIsThisForItem = {
    title: string;
    description: string;
};

export const whoIsThisForData = {
    perfectFor: [
        {
            title: "SaaS applications.",
            description:
                "Multi-tenant platforms, subscription services, and B2B tools that need to swap between Redis, Postgres, or S3 without a rewrite.",
        },
        {
            title: "Internal tools & admin panels.",
            description:
                "Back-office dashboards and operational tooling where you want to move fast with in-memory adapters in dev and swap to real infrastructure in production.",
        },
        {
            title: "REST & GraphQL APIs.",
            description:
                "Framework-agnostic primitives that plug into Express, Fastify, Hono, or any Node.js HTTP server — no vendor lock-in.",
        },
        {
            title: "Enterprise backend services.",
            description:
                "Distributed locking, circuit breakers, rate limiting, and resilience patterns that work across processes and machines.",
        },
        {
            title: "Modular monoliths.",
            description:
                "Start with one deployable, compose components as you grow — extract services later without changing business logic.",
        },
        {
            title: "Microservices.",
            description:
                "Each service gets the same adapter abstraction — Redis in one, Postgres in another, in-memory for tests — all the same API.",
        },
        {
            title: "Teams avoiding vendor lock-in.",
            description:
                "Every component is adapter-first. Switch your cache, lock, event bus, or file storage backend anytime — zero code changes to your domain logic.",
        },
    ],
    notIdealFor: [
        {
            title: "Frontend-only applications.",
            description:
                "@daiso-tech/core runs on the server. If you're building a React or Vue SPA with no backend, there's nothing here for you.",
        },
        {
            title: "Browser-only libraries.",
            description:
                "The library uses Node.js APIs and server-side primitives — it won't work in the browser.",
        },
        {
            title: "Non-TypeScript projects.",
            description:
                "The entire API surface is typed with generics and inference. Plain JavaScript won't get you the full developer experience — intellisense, auto-complete, and compile-time safety are core features.",
        },
        {
            title: "Serverless-only architectures without long-running processes.",
            description:
                "Components like locks, event buses, and schedulers assume a persistent Node.js process. Pure Lambda-style architectures may not benefit from the full feature set.",
        },
    ],
};

// ─── Code Showcase ────────────────────────────────────────────

export type CodeFile = {
    name: string;
    code: string;
};

export type CodeExample = {
    label: string;
    heading: string;
    description: string;
    bullets: string[];
    files: CodeFile[];
};

export const CODE_EXAMPLES: CodeExample[] = [
    {
        label: "Cache",
        heading: "Cache anything. Swap backends anytime.",
        description:
            "Speed up your application by caching expensive database queries and API responses. Use Redis in production, in-memory for tests — same API, zero rewrites.",
        bullets: [
            "Memory, Redis, Kysely & MongoDB adapters",
            "TTL policies with automatic eviction",
            "Stampede protection built in",
        ],
        files: [
            {
                name: "cache.ts",
                code: `import { createCache } from "@daiso-tech/core";
import { RedisCacheAdapter } from "@daiso-tech/core/cache";

const cache = createCache({
    adapter: new RedisCacheAdapter({ client: redis }),
});

await cache.set("user:42", { name: "Alice" });
const user = await cache.get("user:42");
// { name: "Alice" }`,
            },
            {
                name: "cache.test.ts",
                code: `import { createCache } from "@daiso-tech/core";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache";

// Tests: in-memory — no Docker needed
const cache = createCache({
    adapter: new MemoryCacheAdapter(),
});

// Same API, same assertions — zero changes`,
            },
        ],
    },
    {
        label: "Lock",
        heading: "Distributed locking. No race conditions.",
        description:
            "Guarantee mutual exclusion across multiple processes. Prevent duplicate payment processing, job execution, or any critical section — with automatic lease management and deadlock protection.",
        bullets: [
            "Blocking & non-blocking acquisition",
            "Automatic lease renewal & release",
            "Works across processes and machines",
        ],
        files: [
            {
                name: "payment.service.ts",
                code: `import { createLock, type ILock } from "@daiso-tech/core";
import { RedisLockAdapter } from "@daiso-tech/core/lock";

const lock: ILock = createLock({
    adapter: new RedisLockAdapter({ client: redis }),
});

export async function processOrderPayment(order: Order) {
    const acquired = await lock.acquire(
        \`payment:order-\${order.id}\`,
        { ttl: "30s" },
    );

    if (!acquired) throw new Error("Payment already in progress");

    try {
        await chargeCustomer(order);
    } finally {
        await lock.release(\`payment:order-\${order.id}\`);
    }
}`,
            },
            {
                name: "payment.test.ts",
                code: `import { createLock } from "@daiso-tech/core";
import { MemoryLockAdapter } from "@daiso-tech/core/lock";

// Tests: in-memory — no Redis, no Docker
const lock = createLock({
    adapter: new MemoryLockAdapter(),
});

// Same API, same behavior — zero changes`,
            },
        ],
    },
    {
        label: "File Storage",
        heading: "Upload once. Store anywhere.",
        description:
            "Manage files with a unified API across local disk, in-memory, and AWS S3. Build photo upload services and document management — swap the storage backend without touching business logic.",
        bullets: [
            "Local filesystem, in-memory & S3 adapters",
            "Streaming uploads & downloads",
            "Metadata & lifecycle management",
        ],
        files: [
            {
                name: "storage.ts",
                code: `import { createFileStorage } from "@daiso-tech/core";
import { S3FileStorageAdapter } from "@daiso-tech/core/file-storage";

const storage = createFileStorage({
    adapter: new S3FileStorageAdapter({
        bucket: "uploads",
        region: "eu-west-1",
    }),
});

await storage.put("avatars/alice.png", buffer);
const file = await storage.get("avatars/alice.png");`,
            },
            {
                name: "storage.dev.ts",
                code: `import { createFileStorage } from "@daiso-tech/core";
import { LocalFileStorageAdapter } from "@daiso-tech/core/file-storage";

// Dev: local disk — same API, zero code changes
const storage = createFileStorage({
    adapter: new LocalFileStorageAdapter({
        basePath: "./uploads",
    }),
});`,
            },
        ],
    },
    {
        label: "Event Bus",
        heading: "Publish events. Decouple services.",
        description:
            "Publish and subscribe to events across distributed server instances. Fire-and-forget or guaranteed delivery — with pluggable transport backends that swap without changing your handlers.",
        bullets: [
            "In-memory, Redis & more transports",
            "Topic routing & wildcard patterns",
            "Guaranteed delivery semantics",
        ],
        files: [
            {
                name: "bus.ts",
                code: `import { createEventBus } from "@daiso-tech/core";
import { RedisEventBusAdapter } from "@daiso-tech/core/event-bus";

const bus = createEventBus({
    adapter: new RedisEventBusAdapter({
        client: redis,
    }),
});

bus.subscribe("order.placed", async (event) => {
    await sendEmail(event.payload.userId);
});`,
            },
            {
                name: "publish.ts",
                code: `import { bus } from "./bus";

await bus.publish("order.placed", {
    userId: 42,
    total: 99.95,
});`,
            },
            {
                name: "bus.test.ts",
                code: `import { createEventBus } from "@daiso-tech/core";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus";

// Tests: in-memory — no Docker
const bus = createEventBus({
    adapter: new MemoryEventBusAdapter(),
});

// Same API, same behavior — zero changes`,
            },
        ],
    },
];

export const componentRecord: Record<string, ComponentItemProps & { name: string }> = {
    // ─── Existing: Foundation ──────────────────────────────────
    "Middleware and AOP":     { ...foundationExistingItems[0], name: "Middleware and AOP" },
    "Collection":             { ...foundationExistingItems[1], name: "Collection" },
    "Serde":                  { ...foundationExistingItems[2], name: "Serde" },
    "Codec":                  { ...foundationExistingItems[3], name: "Codec" },
    "Execution Context":      { ...foundationExistingItems[4], name: "Execution Context" },
    "Typed Config Access":    { ...foundationExistingItems[5], name: "Typed Config Access" },
    "Typed Env Access":       { ...foundationExistingItems[6], name: "Typed Env Access" },
    // ─── Existing: Storage ────────────────────────────────────
    "Cache":                  { ...storageExistingItems[0], name: "Cache" },
    "File Storage":           { ...storageExistingItems[1], name: "File Storage" },
    // ─── Existing: Reliability ────────────────────────────────
    "Circuit Breaker":        { ...reliabilityExistingItems[0], name: "Circuit Breaker" },
    "Rate Limiter":           { ...reliabilityExistingItems[1], name: "Rate Limiter" },
    "Resilience":             { ...reliabilityExistingItems[2], name: "Resilience" },
    // ─── Existing: Concurrency ────────────────────────────────
    "Lock":                   { ...concurrencyExistingItems[0], name: "Lock" },
    "Shared Lock":            { ...concurrencyExistingItems[1], name: "Shared Lock" },
    "Semaphore":              { ...concurrencyExistingItems[2], name: "Semaphore" },
    // ─── Existing: Messaging ──────────────────────────────────
    "Event Bus":              { ...messagingExistingItems[0], name: "Event Bus" },
    // ─── Existing: Web ───────────────────────────────────────
    "HTTP Router":            { ...webExistingItems[0], name: "HTTP Router" },
    // ─── Upcoming: Foundation & Runtime ──────────────────────
    "DI Container":           { ...foundationRuntimeItems[0], name: "DI Container" },
    "Transaction Context":    { ...foundationRuntimeItems[1], name: "Transaction Context" },
    "CLI Command":            { ...foundationRuntimeItems[2], name: "CLI Command" },
    "Structured concurrency": { ...foundationRuntimeItems[3], name: "Structured concurrency" },
    "Promise Queue":          { ...foundationRuntimeItems[4], name: "Promise Queue" },
    "Logging & Observability":{ ...foundationRuntimeItems[5], name: "Logging & Observability" },
    "Introspection":          { ...foundationRuntimeItems[6], name: "Introspection" },
    // ─── Upcoming: Reliability & Messaging ───────────────────
    "Job Scheduler":          { ...reliabilityMessagingItems[0], name: "Job Scheduler" },
    "Notifications":          { ...reliabilityMessagingItems[1], name: "Notifications" },
    "Request Reply":          { ...reliabilityMessagingItems[2], name: "Request Reply" },
    "Message Queue":          { ...reliabilityMessagingItems[3], name: "Message Queue" },
    "Idempotent Cache":       { ...reliabilityMessagingItems[4], name: "Idempotent Cache" },
    "Outbox Pattern":         { ...reliabilityMessagingItems[5], name: "Outbox Pattern" },
    "Inbox Pattern":          { ...reliabilityMessagingItems[6], name: "Inbox Pattern" },
    // ─── Upcoming: Security ──────────────────────────────────
    "Authentication":         { ...securityItems[0], name: "Authentication" },
    "Session Management":     { ...securityItems[1], name: "Session Management" },
    "Authorization Gates":    { ...securityItems[2], name: "Authorization Gates" },
    "Apache Casbin Integration": { ...securityItems[3], name: "Apache Casbin Integration" },
    // ─── Upcoming: Integrations ──────────────────────────────
    "Text Search":            { ...integrationsItems[0], name: "Text Search" },
    "OpenAPI":                { ...integrationsItems[1], name: "OpenAPI" },
    "SQL Integration":        { ...integrationsItems[2], name: "SQL Integration" },
    "Mongoose and Native MongoDB Integration": { ...integrationsItems[3], name: "Mongoose and Native MongoDB Integration" },
    "PostgreSQL Native Integration": { ...integrationsItems[4], name: "PostgreSQL Native Integration" },
    "SSH Deployment":         { ...integrationsItems[5], name: "SSH Deployment" },
    "Image Manipulator":      { ...integrationsItems[6], name: "Image Manipulator" },
    "Process Manager":        { ...integrationsItems[7], name: "Process Manager" },
    // ─── Upcoming: Dev Tooling ───────────────────────────────
    "DI Autodiscovery Vite Plugin":       { ...devToolingItems[0], name: "DI Autodiscovery Vite Plugin" },
    "Event Autodiscovery Vite Plugin":    { ...devToolingItems[1], name: "Event Autodiscovery Vite Plugin" },
    "Job Scheduler Autodiscovery Vite Plugin": { ...devToolingItems[2], name: "Job Scheduler Autodiscovery Vite Plugin" },
    "Request Reply Autodiscovery Vite Plugin": { ...devToolingItems[3], name: "Request Reply Autodiscovery Vite Plugin" },
    "Message Queue Autodiscovery Vite Plugin": { ...devToolingItems[4], name: "Message Queue Autodiscovery Vite Plugin" },
    "CLI Command Autodiscovery Vite Plugin":   { ...devToolingItems[5], name: "CLI Command Autodiscovery Vite Plugin" },
    "Scaffolding CLI":       { ...devToolingItems[6], name: "Scaffolding CLI" },
    // ─── Upcoming: Control Plane ─────────────────────────────
    "Daiso Platform":         { ...controlPlaneItems[0], name: "Daiso Platform" },
    "Dashboard & Observability": { ...controlPlaneItems[1], name: "Dashboard & Observability" },
    "Multi-Tenancy":          { ...controlPlaneItems[2], name: "Multi-Tenancy" },
};
