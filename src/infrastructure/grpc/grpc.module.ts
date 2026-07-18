import { ClientsModule, Transport } from "@nestjs/microservices";
import { ACCESS_CONTROL_PROTO_PATH } from "@monadiam/shared";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccessControlClient } from "./access-control.client";
import { GRPC_CONFIG } from "./tokens";

@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: GRPC_CONFIG,
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: "access_control",
                        protoPath: ACCESS_CONTROL_PROTO_PATH,
                        url: config.getOrThrow<string>("ACCESS_CONTROL_GRPC_URL"),
                    },
                }),
            },
        ]),
    ],
    providers: [AccessControlClient],
    exports: [AccessControlClient],
})
export class GRPCModule {}
