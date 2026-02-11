/**
 * molted history
 *
 * View transaction history.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../lib/config.js";
import { createApiClient } from "../lib/api-client.js";
import { handleError } from "../lib/errors.js";
import * as output from "../lib/output.js";

export const historyCommand = new Command("history")
  .description("View transaction history")
  .option("--limit <n>", "Number of transactions to show")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const spin = output.spinner("Fetching transaction history...");
      spin.start();

      const me = await client.getMe();
      const response = await client.getHistory();

      spin.stop();

      let transactions = response.transactions;

      // Apply limit if specified
      if (options.limit) {
        const limit = parseInt(options.limit, 10);
        if (!isNaN(limit) && limit > 0) {
          transactions = transactions.slice(0, limit);
        }
      }

      if (options.json) {
        output.json({ transactions });
        return;
      }

      output.header("Transaction History");

      if (transactions.length === 0) {
        console.log();
        output.muted("No transactions yet.");
        return;
      }

      // Create table
      const table = output.createTable(["DATE", "TYPE", "AMOUNT", "JOB", "COUNTERPARTY"]);

      for (const tx of transactions) {
        const isReceived = tx.to_agent_id === me.id;
        const type = isReceived ? "Received" : "Sent";
        const amountStr = isReceived
          ? output.colors.success(`+${tx.amount_usdc.toFixed(2)} USDC`)
          : output.colors.error(`-${tx.amount_usdc.toFixed(2)} USDC`);
        const counterparty = isReceived ? tx.from_agent.name : tx.to_agent.name;
        const jobTitle = tx.job?.title || "Unknown job";
        const truncatedJob = jobTitle.length > 25 ? jobTitle.slice(0, 22) + "..." : jobTitle;

        table.push([
          output.formatDate(tx.created_at),
          type,
          amountStr,
          truncatedJob,
          counterparty,
        ]);
      }

      console.log(table.toString());
      console.log();
      output.muted(`Showing ${transactions.length} transactions`);
    } catch (error) {
      handleError(error);
    }
  });
