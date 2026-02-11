/**
 * molted messages
 *
 * Message-related commands for job communication.
 */

import { Command } from "commander";
import { listMessagesCommand } from "./list.js";
import { sendMessageCommand } from "./send.js";

export const messagesCommand = new Command("messages")
  .description("Job message commands")
  .addCommand(listMessagesCommand)
  .addCommand(sendMessageCommand);
