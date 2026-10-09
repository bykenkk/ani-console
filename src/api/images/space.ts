import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  EnableImageSpaceInput,
  EnableImageSpaceRequest,
  ImageSpace,
  ImagePublisherCredential,
  ImageCredentialDelivery,
  ImageCredentialVersionInput,
  ImageCredentialVersionRequest,
} from "./types";

const enableScope = createIdempotencyScope("image-space-enable", ["POST"]);
const issueScope = createIdempotencyScope("image-publisher-issue", ["POST"]);
const resetScope = createIdempotencyScope("image-publisher-reset", ["POST"]);
const disableScope = createIdempotencyScope("image-publisher-disable", ["POST"]);

export function getImageSpace(signal?: AbortSignal): Promise<ImageSpace> {
  return coreRequest<ImageSpace>("/images/space", { method: "GET", signal });
}
export function enableImageSpace(
  input: EnableImageSpaceInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(enableScope, input, async ({ idempotency_key, ...data }) => {
    await coreRequest<unknown, EnableImageSpaceRequest>("/images/space:enable", {
      method: "POST",
      data: { ...data, idempotencyKey: idempotency_key },
      signal,
    });
  });
}
export function getImagePublisherCredential(
  signal?: AbortSignal,
): Promise<ImagePublisherCredential> {
  return coreRequest<ImagePublisherCredential>("/images/publisher-credential", {
    method: "GET",
    signal,
  });
}
/** Secret delivery must not be persisted in resource caches or client storage. */
export function issueImagePublisherCredential(
  input: ImageCredentialVersionInput,
  signal?: AbortSignal,
): Promise<ImageCredentialDelivery> {
  return runIdempotentRequest(issueScope, input, ({ idempotency_key, ...data }) =>
    coreRequest<ImageCredentialDelivery, ImageCredentialVersionRequest>(
      "/images/publisher-credential:issue",
      { method: "POST", data: { ...data, idempotencyKey: idempotency_key }, signal },
    ),
  );
}
export function resetImagePublisherCredential(
  input: ImageCredentialVersionInput,
  signal?: AbortSignal,
): Promise<ImageCredentialDelivery> {
  return runIdempotentRequest(resetScope, input, ({ idempotency_key, ...data }) =>
    coreRequest<ImageCredentialDelivery, ImageCredentialVersionRequest>(
      "/images/publisher-credential:reset",
      { method: "POST", data: { ...data, idempotencyKey: idempotency_key }, signal },
    ),
  );
}
export function disableImagePublisherCredential(
  input: ImageCredentialVersionInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(disableScope, input, async ({ idempotency_key, ...data }) => {
    await coreRequest<unknown, ImageCredentialVersionRequest>(
      "/images/publisher-credential:disable",
      {
        method: "POST",
        data: { ...data, idempotencyKey: idempotency_key },
        signal,
      },
    );
  });
}
