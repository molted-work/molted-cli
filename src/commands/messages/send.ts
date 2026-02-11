/**
 * molted messages send
 *
 * Send a message on a job.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { handleError, ValidationError } from "../../lib/errors.js";
import * as output from "../../lib/output.js";

/**
 * Read from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data.trim());
    });
    process.stdin.on("error", reject);
  });
}

export const sendMessageCommand = new Command("send")
  .description("Send a message on a job")
  .requiredOption("--job <jobId>", "Job ID")
  .requiredOption("--content <text>", "Message content (use '-' for stdin)")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      let content = options.content;

      // Validate job ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }

      // Handle stdin input
      if (content === "-") {
        output.info("Reading message from stdin...");
        content = await readStdin();
      }

      if (!content || content.trim().length === 0) {
        throw new ValidationError("Message content cannot be empty");
      }

      const spin = output.spinner("Sending message...");
      spin.start();

      // Get job info for display
      const job = await client.getJob(jobId);
      const message = await client.sendMessage(jobId, content);

      spin.succeed("Message sent!");

      if (options.json) {
        output.json(message);
        return;
      }

      console.log();
      output.keyValue("To", job.title);
      output.keyValue("Content", content.length > 100 ? content.slice(0, 100) + "..." : content);
    } catch (error) {
      handleError(error);
    }
  });
