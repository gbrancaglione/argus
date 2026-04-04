import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiGet, apiPatch } from "./api-client.js";

const server = new McpServer({
  name: "argus",
  version: "1.0.0",
});

// --- Tools ---

server.tool(
  "list_expenses",
  "List credit card expense transactions within a date range. Supports pagination and filtering by category label. Returns individual transactions with amounts, dates, descriptions, and categories.",
  {
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
    page: z
      .number()
      .optional()
      .describe("Page number (default 1)"),
    per_page: z
      .number()
      .optional()
      .describe("Results per page (default 50, max 100)"),
    label_name: z
      .string()
      .optional()
      .describe(
        'Filter by category label name, or "uncategorized" for unlabeled transactions'
      ),
  },
  async ({ from, to, page, per_page, label_name }) => {
    const data = await apiGet("/credit_card_expenses", {
      from,
      to,
      page: page?.toString(),
      per_page: per_page?.toString(),
      label_name,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "expense_summary",
  "Get a spending summary for credit card expenses in a date range. Returns total spent, transaction count, and breakdowns by month, day, and category. Use this to understand overall spending patterns.",
  {
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
  },
  async ({ from, to }) => {
    const data = await apiGet("/credit_card_expenses/summary", { from, to });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "expense_analytics",
  "Get analytics comparing current vs previous period spending on credit cards. Includes monthly trends, category trends over time, and top categories with percentages. Use this for period-over-period comparisons and trend analysis.",
  {
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
  },
  async ({ from, to }) => {
    const data = await apiGet("/credit_card_expenses/analytics", { from, to });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "list_labels",
  "List all spending category labels. Use this to discover available categories before filtering expenses.",
  {},
  async () => {
    const data = await apiGet("/labels");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "list_accounts",
  "List connected financial accounts. Shows account names, types, and balances.",
  {},
  async () => {
    const data = await apiGet("/accounts");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "list_syncs",
  "List recent data sync logs showing when financial data was last imported. Shows sync status, date ranges, and how many transactions were created or updated.",
  {},
  async () => {
    const data = await apiGet("/syncs");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "list_sync_transactions",
  "List transactions created or updated by a specific sync. Use this to review what a sync produced before approving it. Supports filtering by action (created/updated) and pagination.",
  {
    sync_id: z.number().describe("ID of the sync log"),
    sync_action: z
      .enum(["created", "updated"])
      .optional()
      .describe("Filter by sync action: created or updated"),
    page: z.number().optional().describe("Page number (default 1)"),
    per_page: z.number().optional().describe("Results per page (default 50)"),
  },
  async ({ sync_id, sync_action, page, per_page }) => {
    const data = await apiGet(`/syncs/${sync_id}/transactions`, {
      sync_action,
      page: page?.toString(),
      per_page: per_page?.toString(),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "approve_sync",
  "Approve a pending sync, making its transactions visible in all views (analytics, credit card expenses, etc.). Only works on syncs with approval_status='pending'.",
  {
    sync_id: z.number().describe("ID of the sync log to approve"),
  },
  async ({ sync_id }) => {
    const data = await apiPatch(`/syncs/${sync_id}/approve`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "reject_sync",
  "Reject a pending sync, permanently deleting all its transactions. Only works on syncs with approval_status='pending'. This action cannot be undone.",
  {
    sync_id: z.number().describe("ID of the sync log to reject"),
  },
  async ({ sync_id }) => {
    const data = await apiPatch(`/syncs/${sync_id}/reject`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "bulk_categorize",
  "Update the category label on multiple transactions at once. Sets category_edited=true on all affected transactions. Use after reviewing sync results to fix categories before approving.",
  {
    ids: z.array(z.number()).describe("Transaction IDs to update"),
    label_id: z
      .number()
      .nullable()
      .describe("Label ID to assign, or null to clear the category"),
  },
  async ({ ids, label_id }) => {
    const data = await apiPatch("/transactions/bulk_update", { ids, label_id });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
