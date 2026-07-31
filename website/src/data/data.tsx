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

export type FeatureItemProps = {
    name: string;
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
};

export type ComponentItemProps = FeatureItemProps & {
    href?: string;
    badges?: ReactNode[];
    subItems?: ReactNode[];
    maturity?: number;
    completedDate?: ReactNode;
};

// ─── Components Record ──────────────────────────────────────────
// Single source of truth for every component — keyed by name.
// Each curated list below references entries from this record.

export const COMPONENT_RECORD = {
    // ─── Existing: Foundation ──────────────────────────────────
    middleware_and_aop: {
        name: "Middleware and AOP",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Middleware and AOP</>,
        href: "/docs/components/middleware",
        maturity: 90,
        description: (
            <>
                Composable middleware pipeline with before/after hooks, error
                handling, and context propagation — the foundation for every
                component's plugin system.
            </>
        ),
    } satisfies ComponentItemProps,
    collection: {
        name: "Collection",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Collection</>,
        href: "/docs/components/collection",
        maturity: 90,
        description: (
            <>
                Type-safe collection utilities with powerful query, transform,
                and pagination primitives.
            </>
        ),
    } satisfies ComponentItemProps,
    serde: {
        name: "Serde",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Serde</>,
        href: "/docs/components/serde",
        maturity: 80,
        description: (
            <>
                Serialize and deserialize data with fully type-safe schemas —
                the backbone for all data interchange across the ecosystem.
            </>
        ),
    } satisfies ComponentItemProps,
    codec: {
        name: "Codec",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Codec</>,
        href: "/docs/components/codec",
        maturity: 80,
        description: (
            <>
                Encode and decode data across formats (JSON, Binary, etc.) with
                a unified, type-safe interface — build custom codecs for any
                protocol.
            </>
        ),
    } satisfies ComponentItemProps,
    execution_context: {
        name: "Execution Context",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Execution Context</>,
        href: "/docs/components/execution_context",
        maturity: 90,
        description: (
            <>
                Async context propagation for request-scoped state, dependency
                injection, and correlation IDs — without thread-local hacks.
            </>
        ),
    } satisfies ComponentItemProps,
    typed_config_access: {
        name: "Typed Config Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Config Access</>,
        href: "/docs/components/config_accessor",
        maturity: 90,
        description: (
            <>
                Safely read structured configuration from any source with
                runtime validation and full TypeScript inference.
            </>
        ),
    } satisfies ComponentItemProps,
    typed_env_access: {
        name: "Typed Env Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Env Access</>,
        href: "/docs/components/env_accessor",
        maturity: 90,
        description: (
            <>
                Type-safe environment variable access with parsing, defaults,
                and validation — never read process.env raw again.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Existing: Storage ────────────────────────────────────
    cache: {
        name: "Cache",
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: <>Cache</>,
        href: "/docs/components/cache/cache_usage",
        maturity: 90,
        description: (
            <>
                Multi-backend caching with pluggable stores (in-memory, Redis,
                etc.), TTL policies, and stampede protection.
            </>
        ),
    } satisfies ComponentItemProps,
    file_storage: {
        name: "File Storage",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>File Storage</>,
        href: "/docs/components/file_storage/file_storage_usage",
        maturity: 90,
        description: (
            <>
                Abstract file storage with adapters for local disk,
                S3-compatible, and other backends — upload, stream, and serve
                with one API.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Existing: Reliability ────────────────────────────────
    circuit_breaker: {
        name: "Circuit Breaker",
        icon: <CircuitBoard size="1.5rem" strokeWidth={1.5} />,
        title: <>Circuit Breaker</>,
        href: "/docs/components/circuit_breaker/circuit_breaker_usage",
        maturity: 90,
        description: (
            <>
                Prevent cascading failures with configurable thresholds,
                half-open recovery, and custom fallback strategies.
            </>
        ),
    } satisfies ComponentItemProps,
    rate_limiter: {
        name: "Rate Limiter",
        icon: <Gauge size="1.5rem" strokeWidth={1.5} />,
        title: <>Rate Limiter</>,
        href: "/docs/components/rate-limiter/rate_limiter_usage",
        maturity: 90,
        description: (
            <>
                Throttle request rates with configurable limits, sliding
                windows, and pluggable backends — protect your services from
                overload.
            </>
        ),
    } satisfies ComponentItemProps,
    resilience: {
        name: "Resilience",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Resilience</>,
        href: "/docs/components/resilience",
        maturity: 90,
        description: (
            <>
                Timeout, fallback, retry, with configurable policies and
                backoffs.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Existing: Concurrency ────────────────────────────────
    lock: {
        name: "Lock",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Lock</>,
        href: "/docs/components/lock/lock_usage",
        maturity: 90,
        description: (
            <>
                Distributed lock primitives with lease management, blocking and
                non-blocking acquisition, and automatic release.
            </>
        ),
    } satisfies ComponentItemProps,
    shared_lock: {
        name: "Shared Lock",
        icon: <Share2 size="1.5rem" strokeWidth={1.5} />,
        title: <>Shared Lock</>,
        href: "/docs/components/shared_lock/shared_lock_usage",
        maturity: 90,
        description: (
            <>
                Read-write distributed locks for coordinating concurrent access
                with shared and exclusive modes.
            </>
        ),
    } satisfies ComponentItemProps,
    semaphore: {
        name: "Semaphore",
        icon: <List size="1.5rem" strokeWidth={1.5} />,
        title: <>Semaphore</>,
        href: "/docs/components/semaphore/semaphore_usage",
        maturity: 90,
        description: (
            <>
                Rate-limit concurrent access to shared resources with dynamic
                permit allocation.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Existing: Messaging ──────────────────────────────────
    event_bus: {
        name: "Event Bus",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Bus</>,
        href: "/docs/components/event_bus/event_bus_usage",
        maturity: 90,
        description: (
            <>
                Pub/sub event bus with multiple transport backends, topic
                routing, and guaranteed delivery semantics.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Existing: Web ───────────────────────────────────────
    http_router: {
        name: "HTTP Router",
        icon: <GitBranch size="1.5rem" strokeWidth={1.5} />,
        title: <>HTTP Router</>,
        href: "/docs/components/http_router/http_router_usage",
        maturity: 90,
        description: (
            <>
                Lightweight, composable HTTP router with middleware chains,
                parameter parsing, and framework-agnostic design.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Foundation & Runtime ──────────────────────
    di_container: {
        name: "DI Container",
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Container</>,
        description: (
            <>
                A lightweight, type-safe dependency injection container for
                wiring application components without tight coupling.
            </>
        ),
    } satisfies ComponentItemProps,
    transaction_context: {
        name: "Transaction Context",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Transaction Context</>,
        description: (
            <>
                Coordinate database transactions across components with the
                after-commit pattern. Foundation for reliable messaging — powers
                the Outbox, Inbox, Scheduler, and Notifications.
            </>
        ),
    } satisfies ComponentItemProps,
    cli_command: {
        name: "CLI Command",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command</>,
        description: (
            <>
                A unified API for defining and executing CLI commands with a
                transport adapter architecture. Run commands locally via child
                processes, remotely over SSH or HTTP, inside Docker containers,
                or through custom transports — all from the same command
                definition.
            </>
        ),
    } satisfies ComponentItemProps,
    structured_concurrency: {
        name: "Structured concurrency",
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: <>Structured concurrency</>,
        description: (
            <>
                Run async tasks in structured scopes where child tasks are tied
                to their parent's lifetime — with automatic cancellation, error
                propagation, and resource cleanup.
            </>
        ),
    } satisfies ComponentItemProps,
    promise_queue: {
        name: "Promise Queue",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Promise Queue</>,
        description: (
            <>
                A configurable promise queue to control the number of
                concurrently executing promises and prevent resource exhaustion.
            </>
        ),
    } satisfies ComponentItemProps,
    logging_observability: {
        name: "Logging & Observability",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>Logging & Observability</>,
        description: (
            <>
                Support for observability — logging, metrics, and tracing — with
                a pluggable adapter system. Pre-built adapters for{" "}
                <a href="https://opentelemetry.io/">OpenTelemetry</a> and a
                local adapter that saves logs, traces, and metrics to disk.
            </>
        ),
    } satisfies ComponentItemProps,
    introspection: {
        name: "Introspection",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Introspection</>,
        description: (
            <>
                Inspect the actual runtime state of any component through
                pre-built CLI commands — view registered handlers, active jobs,
                queue depth, lock holders, and more without digging into logs or
                metrics.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Reliability & Messaging ───────────────────
    job_scheduler: {
        name: "Job Scheduler",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler</>,
        description: (
            <>
                Schedule work with full flexibility — immediate dispatch,
                delayed execution, and recurring jobs. Uses Transaction Context
                for reliable execution.
            </>
        ),
    } satisfies ComponentItemProps,
    notifications: {
        name: "Notifications",
        icon: <Bell size="1.5rem" strokeWidth={1.5} />,
        title: <>Notifications</>,
        description: (
            <>
                Send notifications through multiple channels — synchronous
                dispatching, immediate enqueueing, delayed enqueueing, and
                recurring messages. Planned adapters include Slack, Discord,
                email, SMS, and WebSocket (browser push). Relies on Transaction
                Context and Scheduler.
            </>
        ),
    } satisfies ComponentItemProps,
    request_reply: {
        name: "Request Reply",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply</>,
        description: (
            <>
                A request-reply messaging pattern for sending a message and
                awaiting a typed response. Supports timeouts, retries, and
                pluggable transport backends.
            </>
        ),
    } satisfies ComponentItemProps,
    message_queue: {
        name: "Message Queue",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue</>,
        description: (
            <>
                A message queue abstraction with pluggable backends (in-memory,
                Redis, SQS, RabbitMQ) for reliable async communication between
                services.
            </>
        ),
    } satisfies ComponentItemProps,
    idempotent_cache: {
        name: "Idempotent Cache",
        icon: <Copy size="1.5rem" strokeWidth={1.5} />,
        title: <>Idempotent Cache</>,
        description: (
            <>
                Built-in idempotency support for the Job Scheduler and Event Bus
                to prevent duplicate job execution and event processing.
            </>
        ),
    } satisfies ComponentItemProps,
    outbox_pattern: {
        name: "Outbox Pattern",
        icon: <Send size="1.5rem" strokeWidth={1.5} />,
        title: <>Outbox Pattern</>,
        description: (
            <>
                The transactional outbox pattern to reliably publish messages
                and events as part of a database transaction. Works with
                Transaction Context.
            </>
        ),
    } satisfies ComponentItemProps,
    inbox_pattern: {
        name: "Inbox Pattern",
        icon: <Inbox size="1.5rem" strokeWidth={1.5} />,
        title: <>Inbox Pattern</>,
        description: (
            <>
                The transactional inbox pattern to reliably process incoming
                messages and events with deduplication. Works with Transaction
                Context.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Security ──────────────────────────────────
    authentication: {
        name: "Authentication",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Authentication</>,
        description: (
            <>
                First-class support for username/password, email verification,
                OAuth, and WebAuthn — with a{" "}
                <a href="https://www.better-auth.com/">Better Auth</a>{" "}
                integration for batteries-included setups. Requires Sessions.
            </>
        ),
    } satisfies ComponentItemProps,
    session_management: {
        name: "Session Management",
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: <>Session Management</>,
        description: (
            <>
                Manage user sessions securely with a pluggable, adapter-driven
                API. Required by Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    authorization_gates: {
        name: "Authorization Gates",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Authorization Gates</>,
        description: (
            <>
                Gate primitives for fine-grained, policy-based access control.
                Works alongside Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    apache_casbin_integration: {
        name: "Apache Casbin Integration",
        icon: <Lightbulb size="1.5rem" strokeWidth={1.5} />,
        title: <>Apache Casbin Integration</>,
        description: (
            <>
                Integration with <a href="https://casbin.org/">Casbin</a> for
                advanced authorization using attribute-based, role-based, and
                relationship-based access control models.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Integrations ──────────────────────────────
    text_search: {
        name: "Text Search",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Text Search</>,
        description: (
            <>
                A pluggable text search abstraction with adapter support for
                Elasticsearch, SQL databases, and MongoDB. Integrates with
                MikroORM and other ORMs to automatically synchronise your data
                with search indexes — synchronously or asynchronously.
            </>
        ),
    } satisfies ComponentItemProps,
    open_api: {
        name: "OpenAPI",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>OpenAPI</>,
        description: (
            <>
                First-class OpenAPI support — define your API schema alongside
                your handlers and get spec generation, validation, and
                documentation out of the box.
            </>
        ),
    } satisfies ComponentItemProps,
    sql_integration: {
        name: "SQL Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>SQL Integration</>,
        description: (
            <>
                Pluggable SQL database adapters for Drizzle, Kysely, MikroORM,
                TypeORM, Sequelize, Knex, Prisma (SQL) and raw drivers. Internal
                SQL adapters abstract the database layer while using Kysely as a
                raw SQL query string builder — write queries once, run against
                any supported ORM or raw driver.
            </>
        ),
    } satisfies ComponentItemProps,
    mongoose_native_mongodb_integration: {
        name: "Mongoose and Native MongoDB Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>Mongoose and Native MongoDB Integration</>,
        description: (
            <>
                Native and performant MongoDB-backed implementations of every
                Daiso component — rate limiters, circuit breakers, event bus,
                message queues, job schedulers, request-reply, transaction
                context, and cache — all using MongoDB as the persistence layer.
                No additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    postgresql_native_integration: {
        name: "PostgreSQL Native Integration",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>PostgreSQL Native Integration</>,
        description: (
            <>
                Native and performant PostgreSQL-backed implementations of every
                Daiso component — rate limiters, circuit breakers, locks,
                semaphores, shared locks, event bus, message queues, job
                schedulers, request-reply, transaction context, and cache — all
                using PostgreSQL as the persistence layer via Kysely. No
                additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    ssh_deployment: {
        name: "SSH Deployment",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>SSH Deployment</>,
        description: (
            <>
                Deploy and manage Daiso applications on any VPS or bare-metal
                server via SSH. Push builds, manage processes, configure
                environment, and run health checks — all from a single CLI
                command, no Docker or orchestration required.
            </>
        ),
    } satisfies ComponentItemProps,
    image_manipulator: {
        name: "Image Manipulator",
        icon: <Image size="1.5rem" strokeWidth={1.5} />,
        title: <>Image Manipulator</>,
        description: (
            <>
                A pluggable image manipulation component with adapter support
                for resize, crop, rotate, format conversion, and optimization —
                process images locally via Sharp or delegate to cloud services
                like Cloudinary and Imgix.
            </>
        ),
    } satisfies ComponentItemProps,
    process_manager: {
        name: "Process Manager",
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: <>Process Manager</>,
        description: (
            <>
                Fork, monitor, and manage worker processes with automatic
                restart, health checks, log management, and graceful shutdown.
                Supports cluster mode and zero-downtime reload for Node.js
                applications.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Dev Tooling ───────────────────────────────
    di_autodiscovery_vite_plugin: {
        name: "DI Autodiscovery Vite Plugin",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers DI
                container modules — no manual import wiring required for new
                components or services.
            </>
        ),
    } satisfies ComponentItemProps,
    event_autodiscovery_vite_plugin: {
        name: "Event Autodiscovery Vite Plugin",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers event
                bus handlers and listeners.
            </>
        ),
    } satisfies ComponentItemProps,
    job_scheduler_autodiscovery_vite_plugin: {
        name: "Job Scheduler Autodiscovery Vite Plugin",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                scheduled job definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    request_reply_autodiscovery_vite_plugin: {
        name: "Request Reply Autodiscovery Vite Plugin",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                request-reply endpoints.
            </>
        ),
    } satisfies ComponentItemProps,
    message_queue_autodiscovery_vite_plugin: {
        name: "Message Queue Autodiscovery Vite Plugin",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers message
                queue consumers and handlers.
            </>
        ),
    } satisfies ComponentItemProps,
    cli_command_autodiscovery_vite_plugin: {
        name: "CLI Command Autodiscovery Vite Plugin",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers CLI
                command definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    scaffolding_cli: {
        name: "Scaffolding CLI",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Scaffolding CLI</>,
        description: (
            <>
                Predefined CLI commands to scaffold Daiso projects and
                components. Initialize a new Daiso project from scratch or add
                individual components (DI, Cache, Scheduler, Auth, etc.) to an
                existing project — with sensible defaults, config files, and
                boilerplate code generated automatically.
            </>
        ),
    } satisfies ComponentItemProps,
    // ─── Upcoming: Control Plane ─────────────────────────────
    daiso_platform: {
        name: "Daiso Platform",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>Daiso Platform</>,
        description: (
            <>
                A commercial control plane and runtime platform for deploying,
                managing, and monitoring Daiso-powered applications in
                production.
            </>
        ),
    } satisfies ComponentItemProps,
    dashboard_observability: {
        name: "Dashboard & Observability",
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: <>Dashboard & Observability</>,
        description: (
            <>
                Real-time dashboards for monitoring component health, job
                queues, event throughput, and system metrics across all Daiso
                services.
            </>
        ),
    } satisfies ComponentItemProps,
    multi_tenancy: {
        name: "Multi-Tenancy",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Multi-Tenancy</>,
        description: (
            <>
                Built-in tenant isolation, resource quotas, and per-tenant
                configuration for SaaS applications running on the Daiso
                platform.
            </>
        ),
    } satisfies ComponentItemProps,
};

// ─── Existing — Production-Ready Components ──────────────────────

export const FOUNDATION_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.middleware_and_aop,
    COMPONENT_RECORD.collection,
    COMPONENT_RECORD.serde,
    COMPONENT_RECORD.codec,
    COMPONENT_RECORD.execution_context,
    COMPONENT_RECORD.typed_config_access,
    COMPONENT_RECORD.typed_env_access,
];

export const STORAGE_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.cache,
    COMPONENT_RECORD.file_storage,
];

export const RELIABILITY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.circuit_breaker,
    COMPONENT_RECORD.rate_limiter,
    COMPONENT_RECORD.resilience,
];

export const CONCURRENCY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.lock,
    COMPONENT_RECORD.shared_lock,
    COMPONENT_RECORD.semaphore,
];

export const MESSAGING_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.event_bus,
];

export const WEB_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.http_router,
];

export const EXISTING_ITEMS: ComponentItemProps[] = [
    ...FOUNDATION_EXISTING_ITEMS,
    ...STORAGE_EXISTING_ITEMS,
    ...RELIABILITY_EXISTING_ITEMS,
    ...CONCURRENCY_EXISTING_ITEMS,
    ...MESSAGING_EXISTING_ITEMS,
    ...WEB_EXISTING_ITEMS,
];

// ─── Foundation & Runtime ────────────────────────────────────────

export const FOUNDATION_RUNTIME_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.di_container,
    COMPONENT_RECORD.transaction_context,
    COMPONENT_RECORD.cli_command,
    COMPONENT_RECORD.structured_concurrency,
    COMPONENT_RECORD.promise_queue,
    COMPONENT_RECORD.logging_observability,
    COMPONENT_RECORD.introspection,
];

// ─── Reliability & Messaging ─────────────────────────────────────

export const RELIABILITY_MESSAGING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.job_scheduler,
    COMPONENT_RECORD.notifications,
    COMPONENT_RECORD.request_reply,
    COMPONENT_RECORD.message_queue,
    COMPONENT_RECORD.idempotent_cache,
    COMPONENT_RECORD.outbox_pattern,
    COMPONENT_RECORD.inbox_pattern,
];

// ─── Security ────────────────────────────────────────────────────

export const SECURITY_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.authentication,
    COMPONENT_RECORD.session_management,
    COMPONENT_RECORD.authorization_gates,
    COMPONENT_RECORD.apache_casbin_integration,
];

// ─── Integrations ────────────────────────────────────────────────

export const INTEGRATIONS_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.text_search,
    COMPONENT_RECORD.open_api,
    COMPONENT_RECORD.sql_integration,
    COMPONENT_RECORD.mongoose_native_mongodb_integration,
    COMPONENT_RECORD.postgresql_native_integration,
    COMPONENT_RECORD.ssh_deployment,
    COMPONENT_RECORD.image_manipulator,
    COMPONENT_RECORD.process_manager,
];

// ─── Dev Tooling ─────────────────────────────────────────────────

export const DEV_TOOLING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.di_autodiscovery_vite_plugin,
    COMPONENT_RECORD.event_autodiscovery_vite_plugin,
    COMPONENT_RECORD.job_scheduler_autodiscovery_vite_plugin,
    COMPONENT_RECORD.request_reply_autodiscovery_vite_plugin,
    COMPONENT_RECORD.message_queue_autodiscovery_vite_plugin,
    COMPONENT_RECORD.cli_command_autodiscovery_vite_plugin,
    COMPONENT_RECORD.scaffolding_cli,
];

// ─── Control Plane ──────────────────────────────────────────────

export const CONTROL_PLANE_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.daiso_platform,
    COMPONENT_RECORD.dashboard_observability,
    COMPONENT_RECORD.multi_tenancy,
];

// ─── Homepage preview subset ─────────────────────────────────────

export const UPCOMING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.di_container,
    COMPONENT_RECORD.transaction_context,
    COMPONENT_RECORD.cli_command,
    COMPONENT_RECORD.structured_concurrency,
    COMPONENT_RECORD.promise_queue,
    COMPONENT_RECORD.logging_observability,
    COMPONENT_RECORD.introspection,
    COMPONENT_RECORD.job_scheduler,
];

// ─── Homepage Data ─────────────────────────────────────────────

export const FEATURE_ITEMS = {
    switch_infrastructure_without_rewriting_business_logic: {
        name: "Switch infrastructure without rewriting business logic",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Switch infrastructure without rewriting business logic</>,
        description: (
            <>
                The adapter pattern keeps your code decoupled from vendors. Use
                Redis today, Postgres tomorrow — no refactoring required.
            </>
        ),
    } satisfies FeatureItemProps,
    test_everything_without_docker: {
        name: "Test everything without Docker",
        icon: <SiVitest size="1.5rem" />,
        title: <>Test everything without Docker</>,
        description: (
            <>
                Every component ships with an in-memory adapter and built-in
                Vitest helpers. Write fast, isolated tests — no external
                services needed.
            </>
        ),
    } satisfies FeatureItemProps,
    bring_your_own_framework: {
        name: "Bring your own framework",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Bring your own framework</>,
        description: (
            <>
                No DI container required. Plug directly into Express, NestJS,
                AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.
            </>
        ),
    } satisfies FeatureItemProps,
    type_safe_from_day_one: {
        name: "Type-safe from day one",
        icon: <SiTypescript size="1.5rem" />,
        title: <>Type-safe from day one</>,
        description: (
            <>
                Full TypeScript support with precise generics, rich
                intellisense, and auto-import friendly APIs — errors caught at
                compile time, not runtime.
            </>
        ),
    } satisfies FeatureItemProps,
    standard_schema_validation_built_in: {
        name: "Standard schema validation built in",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Standard schema validation built in</>,
        description: (
            <>
                First-class integration with{" "}
                <a href="https://standardschema.dev/">Standard Schema</a>. Use{" "}
                <a href="https://zod.dev/">Zod</a>, Valibot, or ArkType to
                enforce both compile-time and runtime data safety.
            </>
        ),
    } satisfies FeatureItemProps,
    esm_native_no_commonjs_baggage: {
        name: "ESM native. No CommonJS baggage.",
        icon: <Package size="1.5rem" strokeWidth={1.5} />,
        title: <>ESM native. No CommonJS baggage.</>,
        description: (
            <>
                Built on modern JavaScript primitives. Fully compatible with
                Node.js, Bun, Deno, and the modern bundler ecosystem.
            </>
        ),
    } satisfies FeatureItemProps,
};

export type WhoIsThisForItem = {
    name: string;
    title: ReactNode;
    description: ReactNode;
};

export const PERFECT_FOR = {
    backend_applications: {
        name: "Backend applications:",
        title: <>Backend applications:</>,
        description: (
            <>
                Build REST APIs, background workers, CLIs, and backend other
                services using reusable, composable components.
            </>
        ),
    } satisfies WhoIsThisForItem,
    framework_agnostic_projects: {
        name: "Framework-agnostic projects:",
        title: <>Framework-agnostic projects:</>,
        description: (
            <>
                Works with Express, Fastify, Hono, Next.js, Nuxt, SvelteKit,
                Cloudflare Workers, Bun, Deno, Node.js, and any runtime
                supporting the standard winter tc Fetch api.
            </>
        ),
    } satisfies WhoIsThisForItem,
    adapter_first_architectures: {
        name: "Adapter-first architectures:",
        title: <>Adapter-first architectures:</>,
        description: (
            <>
                Switch between Redis, PostgreSQL, SQLite, MongoDB, S3, local
                storage, in-memory implementations, or your own adapters
                without changing business logic.
            </>
        ),
    } satisfies WhoIsThisForItem,
    distributed_systems: {
        name: "Distributed systems:",
        title: <>Distributed systems:</>,
        description: (
            <>
                Use distributed locks, semaphores, shared locks, circuit
                breakers, rate limiters, caches, and event buses that work
                across multiple processes and machines.
            </>
        ),
    } satisfies WhoIsThisForItem,
    modular_monoliths: {
        name: "Modular monoliths:",
        title: <>Modular monoliths:</>,
        description: (
            <>
                Share the same abstractions, middleware, and adapters across
                a single deployable application. Some components or workers
                can be used in microservices, but the library is primarily
                designed for modular monolith architectures.
            </>
        ),
    } satisfies WhoIsThisForItem,
    library_and_framework_authors: {
        name: "Library and framework authors:",
        title: <>Library and framework authors:</>,
        description: (
            <>
                Build reusable backend libraries on stable interfaces
                instead of coupling to specific vendors or infrastructure.
            </>
        ),
    } satisfies WhoIsThisForItem,
    testing_and_local_development: {
        name: "Testing and local development:",
        title: <>Testing and local development:</>,
        description: (
            <>
                Use in-memory and NoOp adapters for fast, deterministic
                tests, then swap to production infrastructure with
                configuration only.
            </>
        ),
    } satisfies WhoIsThisForItem,
    portable_backend_code: {
        name: "Portable backend code:",
        title: <>Portable backend code:</>,
        description: (
            <>
                Write infrastructure-independent code that can move between
                cloud providers, databases, storage providers, and runtimes
                with minimal changes.
            </>
        ),
    } satisfies WhoIsThisForItem,
    adopting_individual_components: {
        name: "Adopting individual components:",
        title: <>Adopting individual components:</>,
        description: (
            <>
                Use specific components without being forced to adopt the
                entire library or a DI container — each component works
                standalone.
            </>
        ),
    } satisfies WhoIsThisForItem,
    incremental_adoption: {
        name: "Incremental adoption:",
        title: <>Incremental adoption:</>,
        description: (
            <>
                Start with a single component and gradually adopt more as
                your project grows.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

export const NOT_IDEAL_FOR = {
    microservices: {
        name: "Microservices:",
        title: <>Microservices:</>,
        description: (
            <>
                The library is designed for modular monoliths where
                components share the same process and runtime. While some
                components (like distributed locks, circuit breakers, and
                event buses) work across processes, the broader adapter
                model and shared abstractions are not optimized for
                microservice architectures.
            </>
        ),
    } satisfies WhoIsThisForItem,
    frontend_only_applications: {
        name: "Frontend-only applications:",
        title: <>Frontend-only applications:</>,
        description: (
            <>
                @daiso-tech/core is designed for backend and server-side
                development, not browser applications.
            </>
        ),
    } satisfies WhoIsThisForItem,
    projects_tightly_coupled_to_one_vendor: {
        name: "Projects tightly coupled to one vendor:",
        title: <>Projects tightly coupled to one vendor:</>,
        description: (
            <>
                If your application intentionally depends on
                provider-specific features instead of abstractions, the
                adapter model may provide little benefit.
            </>
        ),
    } satisfies WhoIsThisForItem,
    very_small_scripts: {
        name: "Very small scripts:",
        title: <>Very small scripts:</>,
        description: (
            <>
                If you only need a single Redis call, file upload, or cache
                operation, the abstraction layer may be unnecessary
                overhead.
            </>
        ),
    } satisfies WhoIsThisForItem,
    applications_requiring_provider_specific_capabilities: {
        name: "Applications requiring provider-specific capabilities:",
        title: <>Applications requiring provider-specific capabilities:</>,
        description: (
            <>
                Features unique to a particular database, cache, or cloud
                service may require using that provider's native SDK
                directly instead of a generic abstraction.
            </>
        ),
    } satisfies WhoIsThisForItem,
    pure_javascript_projects_prioritizing_simplicity: {
        name: "Pure JavaScript projects prioritizing simplicity:",
        title: <>Pure JavaScript projects prioritizing simplicity:</>,
        description: (
            <>
                While usable from JavaScript, the library is designed around
                TypeScript's type system, generics, and inference for the
                best developer experience.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

// ─── Code Showcase ────────────────────────────────────────────

export type CodeFile = {
    name: string;
    code: string;
};

export type CodeExample = {
    name: string;
    label: ReactNode;
    heading: ReactNode;
    description: ReactNode;
    codeBlockDescription: ReactNode;
    bullets: ReactNode[];
    files: CodeFile[];
};

export const CODE_FILES = {
    main: {
        name: "main.ts",
        code: `import { lockFactory } from "./lock-factory.js";
import { cache } from "./cache.js";

// The LockFactory class uses Serde instance
// internally to register custom serialization logic
const lock = lockFactory.create("payment:order-42");

// The underlying RedisCacheAdapter uses by Cache class
// uses the Serde class to serialize and deserialize
// Will automatically serialize correctly
await cache.put(lock.key, lock);

// Will automatically deserialize correctly
const deserializedLock = await cache.get(lock.key);`,
    } satisfies CodeFile,
    lock_factory: {
        name: "lock-factory.ts",
        code: `import { LockFactory } from "@daiso-tech/core/lock";
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import { serde } from "./serde.js";

export const lockFactory = new LockFactory({
    adapter: new RedisLockAdapter(redis),
    serde,
});`,
    } satisfies CodeFile,
    cache: {
        name: "cache.ts",
        code: `import { Cache } from "@daiso-tech/core/cache";
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { serde } from "./serde.js";

export const cache = new Cache({
    adapter: new RedisCacheAdapter({
        database: redis,
        serde,
    }),
});`,
    } satisfies CodeFile,
    serde: {
        name: "serde.ts",
        code: `import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

export const serde = new Serde(new SuperJsonSerdeAdapter());`,
    } satisfies CodeFile,
    request_handler: {
        name: "request-handler.ts",
        code: `import { ExecutionContext, contextToken } from "@daiso-tech/core/execution-context";
import { AlsExecutionContextAdapter } from "@daiso-tech/core/execution-context/als-execution-context-adapter";

// IExecutionContext uses symbols internally for
// reliable context isolation across async boundaries
const executionContext = new ExecutionContext(
    new AlsExecutionContextAdapter(),
);

const userToken = contextToken<{ id: string; name: string }>("user");
const requestIdToken = contextToken<string>("requestId");

export async function handleRequest(req: Request) {
    return executionContext.run(() => {
        executionContext
            .put(userToken, { id: "123", name: "Alice" })
            .put(requestIdToken, "req-456");
        return processRequest();
    });
}

async function processRequest() {
    // Access context values throughout the call chain
    const user = executionContext.get(userToken);
    const reqId = executionContext.get(requestIdToken);
    console.log("Processing request %s for %s", reqId, user?.name);
}`,
    } satisfies CodeFile,
    middleware: {
        name: "middleware.ts",
        code: `import { use } from "@daiso-tech/core/middleware";
import { retry, timeout } from "@daiso-tech/core/resilience";
import { TimeSpan } from "@daiso-tech/core/time-span";

const fetchUser = async (id: string) => {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
};

const resilientFetch = use(fetchUser, [
    timeout({ waitTime: TimeSpan.fromSeconds(5) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

// Times out after 5s per attempt, retries up to 3 times
const user = await resilientFetch("42");`,
    } satisfies CodeFile,
    enhance: {
        name: "enhance.ts",
        code: `import { enhance, defineMiddleware } from "@daiso-tech/core/middleware";
import { retry, timeout } from "@daiso-tech/core/resilience";
import { TimeSpan } from "@daiso-tech/core/time-span";

class UserService {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

const service = new UserService();
enhance(service, "getUser", [
    timeout({ waitTime: TimeSpan.fromSeconds(10) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

await service.getUser("42");
// Retries up to 3 times on failure
// Throws if a single attempt takes longer than 10s`,
    } satisfies CodeFile,
    plugin: {
        name: "plugin.ts",
        code: `import { withPlugin, type PluginFn } from "@daiso-tech/core/middleware";
import { retry, timeout } from "@daiso-tech/core/resilience";
import { TimeSpan } from "@daiso-tech/core/time-span";

class Fetcher {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

// Reusable plugin factory — apply to any service
const withRetryAndTimeout: PluginFn<Fetcher> = () =>
    (instance, enhance) => {
        enhance(instance, "getUser", [
            timeout({ waitTime: TimeSpan.fromSeconds(10) }),
            retry({ maxAttempts: 3, throwLastError: true }),
        ]);
    };

const fetcher = withPlugin(new Fetcher(), [withRetryAndTimeout()]);

await fetcher.getUser("42");
// Retries up to 3 times, each attempt times out after 10s`,
    } satisfies CodeFile,
    app_api_users_route: {
        name: "app/api/users/route.ts",
        code: `import { HttpRouter, defaultHttpRouterAdapter } from "@daiso-tech/core/http-router";
import { z } from "zod";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});

router.endpoint({
    url: "/",
    method: "POST",
    validation: {
        json: z.object({ name: z.string(), email: z.string().email() }),
    },
    handler: async ({ req, json }) => {
        const { name, email } = await req.json();
        return json({ success: true, name, email });
    },
});

export const GET: RequestHandler = async ({ request }) => router.fetch(request);
export const POST: RequestHandler = async ({ request }) => router.fetch(request);
export const PUT: RequestHandler = async ({ request }) => router.fetch(request);
export const DELETE: RequestHandler = async ({ request }) => router.fetch(request);
export const PATCH: RequestHandler = async ({ request }) => router.fetch(request);`,
    } satisfies CodeFile,
};

export const CODE_EXAMPLES = {
    serde: {
        name: "Serde",
        label: <>Serde</>,
        heading: <>Serialize anything. Restore everything.</>,
        description: (
            <>
                The Serde component provides a unified serialization and
                deserialization engine with fully type-safe schemas. It supports
                custom serializers for any type and includes a built-in
                SuperJSON adapter that handles Date, Map, Set, and BigInt out of
                the box. Serde is used internally across LockFactory, Cache,
                EventBus, and other components.
            </>
        ),
        codeBlockDescription: (
            <>
                This example shows how a single Serde instance is shared across
                LockFactory and Cache. Acquire a lock, store it in the cache,
                and retrieve it — serialization and deserialization happen
                automatically.
            </>
        ),
        bullets: [
            <>Shared serialization engine used throughout Daiso</>,
            <>Powers LockFactory, Cache, EventBus, and more</>,
            <>
                Built-in SuperJSON adapter — Date, Map, Set & BigInt out of the
                box
            </>,
            <>Register custom serializers for your own types</>,
        ],
        files: [
            CODE_FILES.main,
            CODE_FILES.lock_factory,
            CODE_FILES.cache,
            CODE_FILES.serde,
        ],
    } satisfies CodeExample,
    execution_context: {
        name: "ExecutionContext",
        label: <>ExecutionContext</>,
        heading: <>Propagate context across async boundaries.</>,
        description: (
            <>
                The ExecutionContext component propagates any kind of async
                context across execution boundaries. Most components use it to
                become implicitly execution-context-aware, allowing them to
                automatically share the same transaction and other contextual
                state.
            </>
        ),
        codeBlockDescription: (
            <>
                This example shows how ExecutionContext propagates
                request-scoped state (request ID, user info) across async
                boundaries with AsyncLocalStorage — and how to test the same
                logic with a NoOp adapter, no runtime context required.
            </>
        ),
        bullets: [
            <>Type-safe context tokens</>,
            <>Async context propagation</>,
            <>No manual parameter passing</>,
        ],
        files: [
            CODE_FILES.request_handler,
        ],
    } satisfies CodeExample,
    middleware: {
        name: "Middleware",
        label: <>Middleware</>,
        heading: <>AOP-style middleware. Compose behavior. Keep logic clean.</>,
        description: (
            <>
                The Middleware component provides a composable AOP-style
                middleware pipeline with before/after hooks, error handling, and
                context propagation. It supports wrapping standalone functions
                with use(), enhancing class methods with enhance(), and
                packaging reusable middleware into plugins with withPlugin().
                Built-in middlewares include retry, timeout, fallback, and more.
            </>
        ),
        codeBlockDescription: (
            <>
                This example demonstrates three approaches to AOP middleware:
                wrap a standalone function with use(), enhance a class method
                with enhance(), and package reusable middleware into plugins
                with withPlugin().
            </>
        ),
        bullets: [
            <>AOP with before/after hooks around any function</>,
            <>Built-in retry, timeout, fallback middlewares and so many more</>,
            <>
                Function wrapping with use(), class enhancement with enhance(),
                plugin system with withPlugin()
            </>,
            <>
                Built-in prefixing plugins for majority of components and so
                many more
            </>,
        ],
        files: [
            CODE_FILES.middleware,
            CODE_FILES.enhance,
            CODE_FILES.plugin,
        ],
    } satisfies CodeExample,
    http_router: {
        name: "HttpRouter",
        label: <>HttpRouter</>,
        heading: <>Define routes. Stay framework-agnostic.</>,
        description: (
            <>
                The HttpRouter component provides a framework-agnostic HTTP
                routing layer with type-safe endpoint definitions,
                standard-schema validation, and middleware support. It works
                with any Winter TC compatible runtime or adapter and can be used
                across Express, Fastify, Hono, Next.js, Nuxt, SvelteKit, and
                more.
            </>
        ),
        codeBlockDescription: (
            <>
                This example defines a typed POST endpoint with Zod request
                validation and exports it as a SvelteKit server route handler —
                all with a framework-agnostic HTTP router.
            </>
        ),
        bullets: [
            <>Type-safe route definitions with standard-schema validation</>,
            <>
                Works with Next.js App Router, Nuxt, SvelteKit, and any winter
                tc compatible runtime or adapter
            </>,
            <>Build on top of Hono.js Router adapters</>,
            <>Middleware chains & route groups</>,
        ],
        files: [
            CODE_FILES.app_api_users_route,
        ],
    } satisfies CodeExample,
};
