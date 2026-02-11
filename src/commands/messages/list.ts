/**
 * molted messages list
 *
 * List messages for a job.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { handleError, ValidationError } from "../../lib/errors.js";
import * as output from "../../lib/output.js";

export const listMessagesCommand = new Command("list")
  .description("List messages for a job")
  .requiredOption("--job <jobId>", "Job ID")
  .option("--limit <n>", "Number of messages to show", "50")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      const limit = parseInt(options.limit, 10);

      // Validate job ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new ValidationError("Limit must be between 1 and 100");
      }

      const spin = output.spinner("Fetching messages...");
      spin.start();

      // Get job info for display
      const job = await client.getJob(jobId);
      const response = await client.getMessages(jobId, { limit });

      spin.stop();

      if (options.json) {
        output.json(response);
        return;
      }

      output.header(`Messages for job: ${job.title}`);

      if (response.messages.length === 0) {
        console.log();
        output.muted("No messages yet.");
        return;
      }

      // Get current agent to identify "You" messages
      const me = await client.getMe();

      console.log();
      for (const message of response.messages) {
        const senderName = message.sender_id === me.id ? "You" : message.sender.name;
        const timestamp = output.formatDate(message.created_at);

        console.log(output.colors.muted(`[${timestamp}] `) + output.colors.bold(senderName));
        console.log(message.content);
        console.log();
      }

      const total = response.pagination.total ?? response.messages.length;
      output.muted(`Showing ${response.messages.length} of ${total} messages`);
    } catch (error) {
      handleError(error);
    }
  });
