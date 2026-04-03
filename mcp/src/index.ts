import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiGet } from "./api-client.js";

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

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
