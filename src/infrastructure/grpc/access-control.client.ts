import { type ClientGrpc as ClientGRPC } from "@nestjs/microservices";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import { GRPC_CONFIG } from "./tokens";

@Injectable()
export class AccessControlClient implements GRPC.AccessControl.Contract, OnModuleInit {
    declare private service: GRPC.AccessControl.Service.Contract;

    public constructor(
        @Inject(GRPC_CONFIG)
        private readonly client: ClientGRPC,
    ) {}

    public onModuleInit(): void {
        this.service = this.client.getService<GRPC.AccessControl.Service.Contract>("AccessControlService");
    }

    public async listEffectivePrivileges(
        props: GRPC.AccessControl.ListEffectivePrivileges.Props,
    ): GRPC.AccessControl.ListEffectivePrivileges.Result {
        const response = this.service.listEffectivePrivileges(props);
        const { privileges } = await firstValueFrom(response);
        return privileges ?? {};
    }
}
