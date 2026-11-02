// TODO(storage-migration): 保留 ANI 存量契约；仅供旧资源调用，待对应 governance 能力补齐后迁移。
import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  StorageBucketAclUpdateInput,
  StorageBucketAclUpdateRequest,
  StorageBucketClassUpdateInput,
  StorageBucketClassUpdateRequest,
  StorageBucketLifecycleRule,
  StorageBucketLifecycleRuleCreateInput,
  StorageBucketLifecycleRuleCreateRequest,
  StorageBucketLifecycleRuleListResponse,
  StorageBucketRecord,
} from "./types-legacy";

const aclScope = createIdempotencyScope("storage-bucket-acl-update", ["PUT"]);
const classScope = createIdempotencyScope("storage-bucket-class-update", ["PUT"]);

const lifecycleScope = createIdempotencyScope("storage-bucket-lifecycle-rule-create", ["POST"]);
const bucketPath = (bucketId: string) => `/buckets/${encodeURIComponent(bucketId)}`;

export function deleteBucket(bucketId: string): Promise<StorageBucketRecord> {
  return coreRequest<StorageBucketRecord>(bucketPath(bucketId), { method: "DELETE" });
}

export function updateBucketAcl(
  bucketId: string,
  submitData: StorageBucketAclUpdateInput,
): Promise<StorageBucketRecord> {
  return runIdempotentRequest(
    aclScope,
    submitData,
    (body) =>
      coreRequest<StorageBucketRecord, StorageBucketAclUpdateRequest>(
        `${bucketPath(bucketId)}/acl`,
        {
          method: "PUT",
          data: body,
        },
      ),
    [bucketId],
  );
}

export function updateBucketStorageClass(
  bucketId: string,
  submitData: StorageBucketClassUpdateInput,
): Promise<StorageBucketRecord> {
  return runIdempotentRequest(
    classScope,
    submitData,
    (body) =>
      coreRequest<StorageBucketRecord, StorageBucketClassUpdateRequest>(
        `${bucketPath(bucketId)}/storage-class`,
        { method: "PUT", data: body },
      ),
    [bucketId],
  );
}

export function listBucketLifecycleRules(
  bucketId: string,
): Promise<StorageBucketLifecycleRuleListResponse> {
  return coreRequest<StorageBucketLifecycleRuleListResponse>(
    `${bucketPath(bucketId)}/lifecycle-rules`,
    { method: "GET" },
  );
}

export function createBucketLifecycleRule(
  bucketId: string,
  submitData: StorageBucketLifecycleRuleCreateInput,
): Promise<StorageBucketLifecycleRule> {
  return runIdempotentRequest(
    lifecycleScope,
    submitData,
    (body) =>
      coreRequest<StorageBucketLifecycleRule, StorageBucketLifecycleRuleCreateRequest>(
        `${bucketPath(bucketId)}/lifecycle-rules`,
        { method: "POST", data: body },
      ),
    [bucketId],
  );
}

export function deleteBucketLifecycleRule(
  bucketId: string,
  ruleId: string,
): Promise<StorageBucketLifecycleRuleListResponse> {
  return coreRequest<StorageBucketLifecycleRuleListResponse>(
    `${bucketPath(bucketId)}/lifecycle-rules/${encodeURIComponent(ruleId)}`,
    { method: "DELETE" },
  );
}

export type {
  StorageBucketAcl,
  StorageBucketClass,
  StorageBucketLifecycleRule,
  StorageBucketRecord,
} from "./types-legacy";
