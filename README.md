# @monadiam/template-service

NestJS service template for the MonadIAM platform.

It includes authentication against `identity-service`, permission checks through
`access-control-service`, audit/change logs with outbox archival, and BullMQ
retention cleanup.

Domain-specific entities, commands, queries, and controllers are intentionally
left minimal.

----

<details>
<summary><strong>What's Included</strong></summary>

| Area                                 | Files                                            |
|:-------------------------------------|:-------------------------------------------------|
| Authn and permission guards          | `src/context/infrastructure/guards`              |
| Access cache and invalidation        | `src/context/infrastructure/queues/access-cache` |
| Kafka retry/dead-letter flow         | `src/context/infrastructure/queues/kafka-retry`  |
| Vault Transit client                 | `src/common/services/vault-transit.service.ts`   |
| Audit/change log transaction manager | `src/common/transaction-manager`                 |
| Access Control gRPC client           | `src/infrastructure/grpc`                        |
| PostgreSQL config and migrations     | `src/infrastructure/database`                    |
| Redis config                         | `src/infrastructure/redis`                       |
| Observability                        | `src/observability`                              |
| Docker local runtime                 | `docker`, `docker-compose.yml`                   |

Generic exports that are expected to be used by future domain code may be marked
with `/** @public */` so `knip` does not report them while the template is still
empty.

</details>

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Start the [infra](https://github.com/MonadIAM/infra) repository first.

2. Start [identity-service](https://github.com/MonadIAM/identity-service) and
[access-control-service](https://github.com/MonadIAM/access-control-service)
when authenticated/authorized flows are required.

3. Create the local env file:

```sh
make env
```

4. Build and start the service:

```sh
make build
make up
```

The local service container depends on:

| Dependency          | Address inside Docker network      |
|:--------------------|:-----------------------------------|
| PostgreSQL          | `template-postgresql:5432`         |
| Redis               | `template-redis:6379`              |
| Kafka               | `kafka:29092`                      |
| Vault               | `vault:8200`                       |
| Identity JWKS       | `identity-service-app:4002`        |
| Access Control gRPC | `access-control-service-app:50051` |

Shared Docker networks are created by the infra repository:
`postgres-net`, `redis-net`, `kafka-net`, and `vault-net`.

</details>

----

<details>
<summary><strong>Local Ports</strong></summary>

| Resource   | Port                                 |
|:-----------|:-------------------------------------|
| HTTP API   | `4000`                               |
| PostgreSQL | `6000` on host, `5432` inside Docker |
| Redis      | `7000` on host, `6379` inside Docker |

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Makefile                          | Description                                                         |
|:----------------------------------|:--------------------------------------------------------------------|
| **Infrastructure**                |                                                                     |
| `make env`                        | Create `.env` from `.env.local.example`.                            |
| `make build`                      | Build the application image.                                        |
| `make up`                         | Start service, Vault bootstrap, and Vault Agent.                    |
| `make down`                       | Stop and remove service containers.                                 |
| `make restart`                    | Run `make down` and `make up`.                                      |
| **Development**                   |                                                                     |
| `make lint`                       | Run ESLint code checks.                                             |
| `make knip`                       | Detect unused exports, files, and dependencies.                     |
| `make swagger`                    | Generate the OpenAPI Swagger JSON file.                             |
| `make postman`                    | Generate and patch the Postman collection JSON file.                |
| `make docs`                       | Generate Swagger and Postman documentation artifacts.               |
| `make intl-types`                 | Generate TypeScript types from the translation dictionaries.        |
| `make intl-check`                 | Check that all languages contain the same translation keys.         |
| **Database**                      |                                                                     |
| `make migrate`                    | Apply pending MikroORM migrations in the running service container. |
| `make migration name="..."`       | Generate a MikroORM migration in the running service container.     |
| `make empty-migration name="..."` | Generate a blank MikroORM migration.                                |
| `make seed`                       | Run the PostgreSQL seeder in the running service container.         |
| **Test**                          |                                                                     |
| `make test`                       | Run unit tests.                                                     |
| `make coverage`                   | Run unit tests with coverage report.                                |

</details>

----
