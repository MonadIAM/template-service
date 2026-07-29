declare namespace InfrastructureServices {
    namespace AccessCache {
        interface InternalContract {
            resolveVersionedKey(props: ResolveVersionedKey.Props): ResolveVersionedKey.Result;
        }

        interface Contract extends InternalContract {
            checkPermissions(props: CheckPermissions.Props): CheckPermissions.Result;
            deleteAccount(props: DeleteAccount.Props): DeleteAccount.Result;
            deleteRealm(props: DeleteRealm.Props): DeleteRealm.Result;
            delete(props: Delete.Props): Delete.Result;
            deleteAll(): DeleteAll.Result;
        }

        namespace DeleteAccount {
            type Props = {
                account: string;
            };

            type Result = Promise<void>;
        }

        namespace DeleteRealm {
            type Props = {
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace CheckPermissions {
            type Props = {
                permissions: string[];
                globalOnly?: boolean;
                account: string;
                realm: string;
            };

            type Result = Promise<string[]>;
        }

        namespace Delete {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace DeleteAll {
            type Result = Promise<void>;
        }

        namespace ResolveVersionedKey {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = Promise<string>;
        }
    }

    namespace ReauthenticationCache {
        interface Contract {
            set(props: Set): Promise<void>;
            exists(props: Exists): Promise<boolean>;
            delete(props: Delete): Promise<void>;
        }

        type Set = {
            session: string;
            ttl: number;
        };

        type Exists = {
            session: string;
        };

        type Delete = {
            session: string;
        };
    }

    namespace BlacklistCache {
        interface Contract {
            exists(props: Exists): Promise<boolean>;
            set(props: Set): Promise<void>;
        }

        type Set = {
            session: string;
            ttl: number;
        };

        type Exists = {
            session: string;
        };
    }
}
