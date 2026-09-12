import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Domain {
            type Mock = ReturnType<typeof jest.fn>;

            namespace Core {
                interface Transaction {
                    readonly entityManager: ORM.EntityManager;
                    readonly persist: Mock;
                    readonly remove: Mock;
                    readonly flush: Mock;
                    readonly clear: Mock;
                    readonly merge: Mock;
                }

                interface Contract {
                    readonly createChangeLog: CreateChangeLog.Signature;
                    readonly transaction: TransactionFactory.Signature;
                    readonly createAuditLog: CreateAuditLog.Signature;
                    readonly createExample: CreateExample.Signature;
                    readonly config: Config.Signature;
                }

                namespace TransactionFactory {
                    type Result = Transaction;

                    type Signature = () => Result;
                }

                namespace Config {
                    type Props = {
                        readonly values?: Record<string, unknown>;
                    };

                    type Result = ConfigService;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateExample {
                    type Props = Partial<ORM.AnyEntity>;

                    type Result = ORM.AnyEntity;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateAuditLog {
                    type Props = Partial<SystemEntities.AuditLog>;

                    type Result = SystemEntities.AuditLog;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateChangeLog {
                    type Props = Partial<SystemEntities.ChangeLog>;

                    type Result = SystemEntities.ChangeLog;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
