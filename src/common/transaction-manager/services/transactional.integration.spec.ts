import { AccessCacheTopicAction, InvalidationScope } from "@monadiam/shared";
import { describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { TransactionalHelper } from "~testing/integration/transaction-manager/transactional.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { AuditLog, ChangeLog, Outbox } from "../entities";

describe("TransactionalService integration", () => {
    const helper = new TransactionalHelper();
    const suite = postgresSuite({
        repository: ({ orm }) => helper.createTransactionalServiceContext({ orm }),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    const AUDIT_PROPS = {
        context: { ip: "127.0.0.1", userAgent: "transactional-integration" },
        actionType: ActionType.CREATE,
        entityType: EntityType.EXAMPLE,
        actor: randomUUID(),
        realm: randomUUID(),
    };

    it("commits audit log and archive outbox in one trace", async () => {
        await suite.repository().service.run({
            audit: { ...AUDIT_PROPS, input: { password: "secret-value" } },
            execute: () => Promise.resolve(),
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const auditLogs = await readManager.find(AuditLog, {});

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0]).toEqual(
            expect.objectContaining({
                input: { password: "masked:secret-value" },
                signature: expect.stringContaining("signed:AuditLog:"),
                keyVersion: 7,
            }),
        );
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE })).resolves.toBe(1);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
    });

    it("runs without audit context", async () => {
        await suite.repository().service.run({
            execute: () => Promise.resolve(),
        });

        await helper.expectNoTransactionRows(suite.repository().readManager);
    });

    it("emits audit log, audit archive and outbox without change log", async () => {
        await suite.repository().service.emit({
            audit: { ...AUDIT_PROPS, input: { password: "rejected-secret" } },
            payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
            actionType: AccessCacheTopicAction.INVALIDATE,
            destinationTopic: KafkaTopic.ACCESS_CACHE,
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const auditLogs = await readManager.find(AuditLog, {});

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0]).toEqual(
            expect.objectContaining({
                input: { password: "masked:rejected-secret" },
                signature: expect.stringContaining("signed:AuditLog:"),
                keyVersion: 7,
            }),
        );
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE })).resolves.toBe(1);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE })).resolves.toBe(1);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
    });

    it("does not execute domain code when audit signing fails", async () => {
        const externalError = new Error("vault signing unavailable");
        const execute = jest.fn<(transaction: ORM.EntityManager) => void>();
        const logMaskingService = helper.createLogMaskingService({
            sign: () => Promise.reject(externalError),
        });
        const service = helper.createTransactionalServiceContext({
            orm: suite.repository().orm,
            logMaskingService,
        }).service;

        await expect(
            service.run({
                audit: AUDIT_PROPS,
                execute,
            }),
        ).rejects.toBe(externalError);

        expect(execute).not.toHaveBeenCalled();
        await helper.expectNoTransactionRows(suite.repository().readManager);
    });

    it("preserves external dependency errors raised before transaction commit", async () => {
        const externalError = new Error("schema registry unavailable");
        const outboxService = helper.createOutboxService({
            build: () => {
                throw externalError;
            },
        });
        const service = helper.createTransactionalServiceContext({
            logMaskingService: helper.createLogMaskingService(),
            orm: suite.repository().orm,
            outboxService,
        }).service;

        await expect(
            service.emit({
                audit: AUDIT_PROPS,
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            }),
        ).rejects.toBe(externalError);

        await helper.expectNoTransactionRows(suite.repository().readManager);
    });
});
