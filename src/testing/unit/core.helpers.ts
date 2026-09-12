import { ChangeSetType } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";

import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";

export class DomainServiceCoreUnitHelpers implements Unit.Domain.Core.Contract {
    public transaction(): Unit.Domain.Core.Transaction {
        const flush = jest.fn(() => Promise.resolve());
        const persist = jest.fn();
        const remove = jest.fn();
        const clear = jest.fn();
        const merge = jest.fn();

        return {
            entityManager: this.contract<ORM.EntityManager>({ persist, remove, flush, clear, merge }),
            persist,
            remove,
            flush,
            clear,
            merge,
        };
    }

    public config(props: Unit.Domain.Core.Config.Props = {}): ConfigService {
        return this.contract<ConfigService>({
            getOrThrow: jest.fn((key: string) => props.values?.[key]),
        });
    }

    public createExample(props: Unit.Domain.Core.CreateExample.Props = {}): Unit.Domain.Core.CreateExample.Result {
        return this.contract<ORM.AnyEntity>({
            id: "00000000-0000-4000-8000-0000000000ff",
            ...props,
        });
    }

    public createAuditLog(props: Unit.Domain.Core.CreateAuditLog.Props = {}): SystemEntities.AuditLog {
        const entity = new AuditLog({
            context: { userAgent: "unit-agent", ip: "127.0.0.1" },
            actionType: "CREATE",
            entityType: "EXAMPLE",
        });

        Object.assign(entity, props);

        return entity;
    }

    public createChangeLog(props: Unit.Domain.Core.CreateChangeLog.Props = {}): SystemEntities.ChangeLog {
        const entity = new ChangeLog({
            auditEntry: "00000000-0000-4000-8000-0000000000fe",
            entity: "00000000-0000-4000-8000-0000000000fd",
            changeType: ChangeSetType.CREATE,
            entityType: "EXAMPLE",
            delta: {},
        });

        Object.assign(entity, props);

        return entity;
    }

    protected contract<T>(value: object): T {
        return value as T;
    }
}
