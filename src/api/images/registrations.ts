import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ImageRegistration,
  ImageRegistrationListParams,
  ImageRegistrationListResponse,
  ImageRegistrationScope,
  RegisterImageInput,
  RegisterImageRequest,
  UpdateImageRegistrationInput,
  UpdateImageRegistrationRequest,
  UnregisterImageInput,
  UnregisterImageRequest,
} from "./types";

const registerScope = createIdempotencyScope("image-registration-create", ["POST"]);
const updateScope = createIdempotencyScope("image-registration-update", ["PATCH"]);
const unregisterScope = createIdempotencyScope("image-registration-unregister", ["POST"]);
const imagePath = (id: string) => `/images/registrations/${encodeURIComponent(id)}`;

export function listImageRegistrations(
  params: ImageRegistrationListParams,
  signal?: AbortSignal,
): Promise<ImageRegistrationListResponse> {
  return coreRequest<ImageRegistrationListResponse>("/images/registrations", {
    method: "GET",
    params,
    signal,
  });
}
export function getImageRegistration(
  id: string,
  scope: ImageRegistrationScope,
  signal?: AbortSignal,
): Promise<ImageRegistration> {
  return coreRequest<ImageRegistration>(imagePath(id), {
    method: "GET",
    params: { scope },
    signal,
  });
}
export function registerImage(input: RegisterImageInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(registerScope, input, async ({ idempotency_key, ...data }) => {
    await coreRequest<unknown, RegisterImageRequest>("/images/registrations", {
      method: "POST",
      data: { ...data, idempotencyKey: idempotency_key },
      signal,
    });
  });
}
/** Replaces editable metadata; expectedVersion guards concurrent edits. */
export function updateImageRegistration(
  id: string,
  input: UpdateImageRegistrationInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(
    updateScope,
    input,
    async ({ idempotency_key, ...data }) => {
      await coreRequest<unknown, UpdateImageRegistrationRequest>(imagePath(id), {
        method: "PATCH",
        data: { ...data, idempotencyKey: idempotency_key },
        signal,
      });
    },
    [id],
  );
}
/** Unregisters tenant metadata; this is not registry tag deletion. */
export function unregisterImage(
  id: string,
  input: UnregisterImageInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(
    unregisterScope,
    input,
    async ({ idempotency_key, ...data }) => {
      await coreRequest<unknown, UnregisterImageRequest>(`${imagePath(id)}:unregister`, {
        method: "POST",
        data: { ...data, idempotencyKey: idempotency_key },
        signal,
      });
    },
    [id],
  );
}
