import type { CursorPageParams } from "@/api/types";

/** Governance OCI registration contracts. */
export type ImageRegistrationScope = "tenant" | "platform";
export interface ImageRegistrationPlatform {
  os: string;
  architecture: string;
  variant?: string;
}
export interface ImageSpace {
  spaceId: string;
  projectName?: string;
  registryAuthority?: string;
  state: string;
  reason?: string;
  version: string;
  pullCredentialGeneration?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface ImagePublisherCredential {
  spaceId: string;
  generation?: string;
  username?: string;
  state: string;
  version: string;
  expiresAt?: string;
  updatedAt?: string;
}
export interface ImageCredentialDelivery {
  credential: ImagePublisherCredential;
  secret: string;
  replayUntil?: string;
}

export interface ImageCredentialVersionInput {
  expectedVersion: string;
}
export type ImageCredentialVersionRequest = ImageCredentialVersionInput & {
  idempotencyKey: string;
};
export interface ImageRegistration {
  image_id: string;
  scope: ImageRegistrationScope;
  spaceId?: string;
  displayName: string;
  description?: string;
  repository: string;
  sourceReference?: string;
  digest: string;
  resolvedReference: string;
  platforms?: ImageRegistrationPlatform[];
  purposes?: string[];
  accelerator?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
  unregisteredAt?: string;
}
// TODO(pagination-migration): governance ListImagesRequest 仍使用 limit/cursor，保留过渡请求；后端支持 page/pageSize 后再接 PageParams。
export interface ImageRegistrationListParams extends CursorPageParams {
  /** platform reads the shared catalogue; it does not grant platform writes. */
  scope: ImageRegistrationScope;
  search?: string;
  purposes?: string[];
  accelerator?: string;
}
export interface ImageRegistrationListResponse {
  items: ImageRegistration[];
  nextCursor?: string;
  total: string;
}
export interface RegisterImageInput {
  imageReference: string;
  displayName: string;
  description?: string;
  purposes: string[];
  accelerator?: string;
}
export type RegisterImageRequest = RegisterImageInput & { idempotencyKey: string };
export interface UpdateImageRegistrationInput {
  displayName: string;
  description?: string;
  purposes: string[];
  accelerator?: string;
  expectedVersion: string;
}
export type UpdateImageRegistrationRequest = UpdateImageRegistrationInput & {
  idempotencyKey: string;
};
export interface UnregisterImageInput {
  expectedVersion: string;
}
export type UnregisterImageRequest = UnregisterImageInput & { idempotencyKey: string };
