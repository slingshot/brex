import { fail } from "./common";

/** Loosely-typed shape of a parsed OpenAPI 3.0.x document (only what we read). */
export interface SpecDocument {
  openapi?: string;
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

export interface PathItem {
  parameters?: ParameterObject[];
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
}

export interface OperationObject {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  deprecated?: boolean;
  parameters?: ParameterObject[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, unknown>;
  };
  responses?: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
}

export interface ParameterObject {
  name?: string;
  in?: "query" | "path" | "header" | "cookie";
  required?: boolean;
  $ref?: string;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: SchemaObject }>;
}

export interface SchemaObject {
  $ref?: string;
  type?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  discriminator?: unknown;
  required?: string[];
}

const HTTP_METHODS = ["get", "put", "post", "delete", "patch"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/** One API operation, extracted from a spec and validated against SDK assumptions. */
export interface OperationIR {
  specId: string;
  path: string;
  method: HttpMethod;
  operationId: string;
  tag: string;
  summary: string | undefined;
  deprecated: boolean;
  scopes: string[];
  /** Path parameter names, in the order they appear in the URL template. */
  pathParams: string[];
  queryParamNames: string[];
  queryHasRequired: boolean;
  hasBody: boolean;
  bodyRequired: boolean;
  idempotency: "required" | "optional" | "none";
  successStatus: string;
  successHasJson: boolean;
  paginated: boolean;
}

const JSON_CONTENT = "application/json";
const IDEMPOTENCY_HEADER = "idempotency-key";

/** Resolve a `$ref` like `#/components/schemas/Foo` within the same document. */
export function resolveRef(doc: SpecDocument, schema: SchemaObject | undefined): SchemaObject {
  if (!schema) return {};
  if (schema.$ref) {
    const name = schema.$ref.replace("#/components/schemas/", "");
    return doc.components?.schemas?.[name] ?? {};
  }
  return schema;
}

function isPaginated(doc: SpecDocument, op: OperationObject, queryParamNames: string[]): boolean {
  if (!queryParamNames.includes("cursor")) return false;
  const success = Object.entries(op.responses ?? {}).find(([status]) => status.startsWith("2"));
  const schema = resolveRef(doc, success?.[1]?.content?.[JSON_CONTENT]?.schema);
  const props = schema.properties ?? {};
  return props.items?.type === "array" && "next_cursor" in props;
}

/**
 * Walks a spec's `paths` (webhook event docs under `x-webhooks` are naturally
 * excluded) and extracts one validated {@link OperationIR} per operation.
 * Hard-fails on anything that violates the SDK's assumptions, so upstream spec
 * changes surface as loud generation errors instead of silently wrong output.
 */
export function extractOperations(specId: string, doc: SpecDocument): OperationIR[] {
  const ops: OperationIR[] = [];

  for (const [path, pathItem] of Object.entries(doc.paths ?? {}).sort()) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const where = `${specId}: ${method.toUpperCase()} ${path}`;

      const operationId = op.operationId;
      if (!operationId) fail(`${where} has no operationId`);
      const tags = op.tags ?? [];
      const tag = tags[0];
      if (tags.length !== 1 || !tag) {
        fail(`${where} (${operationId}) must have exactly one tag, got [${tags.join(", ")}]`);
      }

      const params = [...(pathItem.parameters ?? []), ...(op.parameters ?? [])];
      let idempotency: OperationIR["idempotency"] = "none";
      let queryHasRequired = false;
      const queryParamNames: string[] = [];
      for (const param of params) {
        if (param.$ref) fail(`${where} (${operationId}) uses a $ref parameter; unsupported`);
        if (param.in === "header") {
          if (param.name?.toLowerCase() !== IDEMPOTENCY_HEADER) {
            fail(
              `${where} (${operationId}) has unexpected header param "${param.name}"; ` +
                "only Idempotency-Key is supported — extend src/core to handle this",
            );
          }
          idempotency = param.required ? "required" : "optional";
        } else if (param.in === "query" && param.name) {
          queryParamNames.push(param.name);
          if (param.required) queryHasRequired = true;
        }
      }

      // Path params must exactly match the URL template, in template order.
      const templateParams = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1] as string);
      const declaredPathParams = new Set(
        params.filter((p) => p.in === "path").map((p) => p.name ?? ""),
      );
      for (const name of templateParams) {
        if (!declaredPathParams.has(name)) {
          fail(`${where} (${operationId}) path template param "{${name}}" is not declared`);
        }
      }

      const bodyContent = op.requestBody?.content;
      if (bodyContent && !bodyContent[JSON_CONTENT]) {
        fail(
          `${where} (${operationId}) has a non-JSON request body ` +
            `[${Object.keys(bodyContent).join(", ")}]; unsupported`,
        );
      }

      const successEntries = Object.entries(op.responses ?? {}).filter(([s]) => s.startsWith("2"));
      const success = successEntries[0];
      if (successEntries.length !== 1 || !success) {
        fail(
          `${where} (${operationId}) must have exactly one 2xx response, ` +
            `got [${successEntries.map(([s]) => s).join(", ")}]`,
        );
      }
      const successContent = success[1].content;
      if (successContent && !successContent[JSON_CONTENT]) {
        fail(
          `${where} (${operationId}) has a non-JSON success response ` +
            `[${Object.keys(successContent).join(", ")}]; unsupported`,
        );
      }

      const securityEntry = op.security?.[0];
      const scopes = securityEntry ? (Object.values(securityEntry)[0] ?? []) : [];

      ops.push({
        specId,
        path,
        method,
        operationId,
        tag,
        summary: op.summary?.trim().replace(/\s+/g, " "),
        deprecated: op.deprecated ?? false,
        scopes,
        pathParams: templateParams,
        queryParamNames,
        queryHasRequired,
        hasBody: Boolean(bodyContent),
        bodyRequired: op.requestBody?.required ?? false,
        idempotency,
        successStatus: success[0],
        successHasJson: Boolean(successContent?.[JSON_CONTENT]),
        paginated: isPaginated(doc, op, queryParamNames),
      });
    }
  }

  return ops;
}
