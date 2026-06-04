import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { delimiter, isAbsolute, join } from "node:path";

export interface CommandDetector {
  commandExists(command: string): Promise<boolean>;
}

export const defaultCommandDetector: CommandDetector = {
  async commandExists(command: string): Promise<boolean> {
    if (command.includes("/") || isAbsolute(command)) {
      try {
        await access(command, constants.X_OK);
        return true;
      } catch {
        return false;
      }
    }

    const pathEntries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
    for (const pathEntry of pathEntries) {
      try {
        await access(join(pathEntry, command), constants.X_OK);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  },
};
