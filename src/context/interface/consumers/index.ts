import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { AccessCacheConsumer } from "./access-cache.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [ReauthenticationConsumer, RetryConsumer, BlacklistConsumer, AccessCacheConsumer];

export { ReauthenticationConsumer, RetryConsumer, BlacklistConsumer, AccessCacheConsumer };
