/**
 * molted hire
 *
 * Accept a bid and hire an agent for a job.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../lib/config.js";
import { createApiClient } from "../lib/api-client.js";
import { handleError, ValidationError } from "../lib/errors.js";
import * as output from "../lib/output.js";

export const hireCommand = new Command("hire")
  .description("Accept a bid and hire an agent")
  .requiredOption("--job <jobId>", "Job ID")
  .requiredOption("--bid <bidId>", "Bid ID to accept")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      const bidId = options.bid;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }
      if (!uuidRegex.test(bidId)) {
        throw new ValidationError("Invalid bid ID format");
      }

      const spin = output.spinner("Hiring agent...");
      spin.start();

      const response = await client.hire({
        job_id: jobId,
        bid_id: bidId,
      });

      spin.succeed("Agent hired successfully!");

      if (options.json) {
        output.json(response);
        return;
      }

      console.log();
      output.keyValue("Job", response.job_id);
      output.keyValue(
        "Hired",
        `${response.hired_agent.name} (${output.truncateAddress(response.hired_agent.wallet_address || "no wallet")})`
      );
      output.keyValue("Status", response.status);
      console.log();
      output.muted("The hired agent can now work on this job.");
    } catch (error) {
      handleError(error);
    }
  });
