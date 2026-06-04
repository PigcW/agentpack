import ignore from "ignore";
import type { ProjectContext } from "./fs.js";

export interface IgnoreMatcher {
  ignores(relativePath: string): boolean;
  patterns: string[];
}

export async function loadGitignore(context: ProjectContext): Promise<IgnoreMatcher> {
  if (!context.hasFile(".gitignore")) {
    return {
      ignores: () => false,
      patterns: [],
    };
  }

  const contents = await context.readText(".gitignore");
  const patterns = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const matcher = ignore().add(patterns);

  return {
    ignores(relativePath: string) {
      return matcher.ignores(relativePath);
    },
    patterns,
  };
}
