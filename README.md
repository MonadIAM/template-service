# @monadiam/template-service

NestJS service template for the MonadIAM platform, distilled from `identity-service` and `access-control-service`.

It's a skeleton that's ready to work out of the box — it already:
- Authenticates requests against tokens issued by `identity-service`;
- Checks permissions through `access-control-service`;
- Writes audit/change logs with outbox-based archival into ClickHouse, and runs BullMQ retention cleanup on a schedule.

> Everything that is genuinely cross-service boilerplate is already here.
> Everything specific to one service's domain is deliberately left out.

Grow your own domain on top of `context/domain`, `context/application`, `context/infrastructure`, and `context/interface`.

> A few generic cross-cutting exports (decorators, base DTOs, `KnexAdapter`, `QueryMode`) are marked with a
> `/** @public */` JSDoc comment. This only tells `knip` not to flag them as unused while no domain code
> references them yet — it has no runtime effect. Search for `@public` (`grep -rn "@public" src`) and drop the
> tag as you start actually using each export; once real code imports it, the tag is redundant.

----

<details>
<summary><strong>What's included</strong></summary>

- **Authn/permission guards** (`context/infrastructure/guards`):
    - `AuthnGuard` verifies access tokens issued by `identity-service` against its JWKS endpoint.
    - `PermissionGuard` checks required permissions through `access-control-service` via a Redis-backed cache (`AccessCacheService`), which falls back to a gRPC call (`AccessControlClient`, `infrastructure/grpc`) on a cache miss, and is invalidated by `access-control-service`'s `ACCESS_CACHE` Kafka topic (`AccessCacheConsumer`).
    - `ReauthenticationGuard` and the blacklist/reauthentication consumers propagate session revocation and step-up-auth state the same way.

- **Audit/Change log + outbox archival** (`common/transaction-manager`):
    - `TransactionalService` wraps every write in a MikroORM transaction, optionally records an `AuditLog` entry, and always mirrors it into `system.outbox`, from which Debezium ships it to `audit-log-archive` / `change-log-archive`.
    - `ChangeLogSubscriber` automatically derives field-level `ChangeLog` deltas for any entity mutated inside a `changeLog: true` operation.
    - Debezium EventRouter config is owned by `infra`; the service only writes to `system.outbox`.

- **BullMQ retention cleanup** (`context/infrastructure/queues/cleanup`, `context/interface/schedulers`):
    - Daily cron jobs purge expired `AuditLog`/`ChangeLog` rows in batches, implemented as a domain service operating on the UoW transaction (repositories stay read-only by convention — see `AuditLogService`/`ChangeLogService`).
    - `queues/kafka-retry` is the generic Kafka retry/dead-letter mechanism; wire your own topics into `retry.consumer.ts`'s `RETRY_TOPICS`/`DEAD_TOPIC_MAP`.

- **Observability** (`src/observability`):
    - Liveness/readiness probes (`GET /health/liveness`, `GET /health/readiness`).
    - Pino logging shipped to Loki.
    - Prometheus metrics.

- **Vault-backed secrets** (`docker/vault`):
    - Provisioning (policies, KV paths, AppRole role) happens once in the `infra` repo's Terraform config, not here - this repo's `docker/vault/bootstrap.sh` only mints a one-time-use AppRole `secret_id`, and `vault-agent` authenticates with it and renders secrets to files under `/vault/secrets` - never baked into images or committed to `.env`.
    - The application's own Postgres credential is dynamic (Vault Database Secrets Engine, short-lived, auto-renewed) rather than a static password - see `infra/terraform/08-database.tf`.

- Standard cross-cutting layer: exceptions, i18n (`en`/`ru`), interceptors, DTO/validation base classes, rate
  limiting (Redis-backed, distributed), CI (gitleaks + lint + typecheck + tests), git hooks.

### What's intentionally left out

`context/domain/entities`, `context/interface/controllers`, `context/application/{commands,queries}` are empty
scaffolds — there is no invented placeholder domain entity. Add your own entity, repository (read-only),
domain service, and controller following the `.d.ts` (contract) / `.ts` (implementation) split used throughout
`identity-service`/`access-control-service`. If you need a queryable REST surface over `AuditLog`/`ChangeLog`
themselves, copy `access-control-service`'s `manage-audit-log.controller.ts` / `manage-change-log.controller.ts`
and their `application/queries` counterparts as a reference.

</details>

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Rename the service: `package.json` (`name`, `repository`, `bugs`, `homepage`), `SERVICE_NAME` in `.env.example`,
   `TemplateModule`/`TemplateModule` references in `src/context/template.module.ts` and `src/main.module.ts`, Vault
   paths (`VAULT_KV_RUNTIME_PATH`), and container/network aliases in `docker-compose.yml`.

2. Make sure the [infra](https://github.com/MonadIAM/infra), [access-control-service](https://github.com/MonadIAM/access-control-service), and [identity-service](https://github.com/MonadIAM/identity-service) repositories are already running locally.

3. Make sure `DOCKER_NETWORK_KAFKA`, `DOCKER_NETWORK_MONITORING`, `DOCKER_NETWORK_POSTGRES`, `DOCKER_NETWORK_REDIS`,
   `DOCKER_NETWORK_VAULT`, `DOCKER_NETWORK_CONSUL`, `DOCKER_VOLUME_VAULT_CA`, and `DOCKER_VOLUME_SERVICE_TLS` in `.env`
   match the actual shared Docker resource names (defaults below), or your custom ones.

4. Create shared Docker networks for inter-service communication, monitoring, Vault, and Consul Connect.
`postgres-net`, `redis-net`, `vault_ca`, and `service_tls` are created by the infra repo:
```sh
docker network create monitoring-network
docker network create kafka-net
docker network create vault-net
docker network create consul-net
```

5. Install the Loki Docker plugin (allows log shipping without extra npm packages):
```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
```

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Makefile                  | Description                                                        |
|:--------------------------|:-------------------------------------------------------------------|
| **Infrastructure**        |                                                                    |
| `make env`                | Generate `.env` from its example (if present).                     |
| `make up`                 | Build application and ops images, then start services.             |
| `make stop`               | Stop containers without removing them.                             |
| `make down`               | Stop and remove containers and networks.                           |
| `make restart`            | Restart the entire infrastructure.                                 |
| `make build-app`          | Build the application runtime image.                               |
| `make build-ops`          | Build the ops image used by migrations and seeders.                |
| `make build`              | Build application and ops images.                                  |
| `make logs`               | Stream logs from the main service.                                 |
| `make logs-all`           | Stream combined logs from all services.                            |
| `make ps`                 | Show status of running containers.                                 |
| `make clean`              | Remove containers along with volumes (wipes DB data).              |
| `make prune`              | Global cleanup of unused Docker resources.                         |
| **Development**           |                                                                    |
| `make lint`               | Run ESLint code checks.                                            |
| `make knip`               | Detect unused exports, files, and dependencies.                    |
| `make swagger`            | Generate the OpenAPI Swagger JSON file.                            |
| `make postman`            | Generate and patch the Postman collection JSON file.               |
| `make docs`               | Generate Swagger and Postman documentation artifacts.              |
| **Database**              |                                                                    |
| `make migration name="*"` | Generate a new migration through the prebuilt ops image.           |
| `make migrate`            | Apply all pending migrations through the prebuilt ops image.       |
| `make seed`               | Seed PostgreSQL through the prebuilt ops image.                    |
| **Test**                  |                                                                    |
| `make test`               | Run unit tests.                                                    |
| `make coverage`           | Run unit tests with coverage report.                               |

</details>

----
