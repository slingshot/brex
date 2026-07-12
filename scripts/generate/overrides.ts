/**
 * Committed, reviewed-like-code corrections to the deterministic naming
 * algorithm. Keys are exact (`<specId>.<tag>` / `<specId>.<operationId>`);
 * generation fails on unused keys so this file can never go stale silently.
 */
export interface TagOverride {
  /** Remap the namespace this tag's operations land in. */
  namespace?: string;
  /** Replace the tag-derived resource nouns used for method-name stripping (PascalCase). */
  resourceNouns?: string[];
}

export interface Overrides {
  tags: Record<string, TagOverride>;
  operations: Record<string, string>;
}

export const overrides: Overrides = {
  tags: {
    // The budgets spec's tags and operationIds are crossed upstream (Brex product
    // renames): `/v2/budgets` ops are named `listSpendBudgets…` but tagged "Budgets";
    // `/v1/budgets` ops are named `listBudgets…` but tagged "Spend Limits (v1)".
    "budgets.Budgets": { resourceNouns: ["SpendBudgets", "SpendBudget"] },
    "budgets.Spend Limits (v1)": { namespace: "budgetsV1", resourceNouns: ["Budgets", "Budget"] },
    "budgets.Spend Limits (v2)": { namespace: "spendLimits" },
    // Receipt Match + Receipt Upload are one user-facing concept.
    "expenses.Receipt Match": { namespace: "receipts" },
    "expenses.Receipt Upload": { namespace: "receipts" },
    // `webhooks.webhooks` beats `webhookSubscriptions.webhookSubscriptions`.
    "webhooks.Webhook Subscriptions": { namespace: "webhooks" },
  },
  operations: {
    "expenses.receiptMatch": "match", // receipts.match()
    "expenses.receiptUpload": "upload", // receipts.upload()
    "team.listCardsByUserId": "list", // cards.list({ user_id }) — user_id is optional
    "webhooks.listWebhookSecrets": "listSecrets", // webhooks.listSecrets()
  },
};
