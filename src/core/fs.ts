import { constants } from "node:fs";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const DEFAULT_EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "target",
  ".venv",
  ".next",
  ".turbo",
]);

export interface ProjectContext {
  root: string;
  hasFile(relativePath: string): boolean;
  hasDir(relativePath: string): boolean;
  listFiles(): string[];
  listDirs(): string[];
  readText(relativePath: string): Promise<string>;
}

export async function createProjectContext(root: string): Promise<ProjectContext> {
  await access(root, constants.R_OK);

  const files: string[] = [];
  const dirs: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = normalizeRelative(root, absolutePath);

      if (entry.isDirectory()) {
        dirs.push(relativePath);
        if (!DEFAULT_EXCLUDED_DIRS.has(entry.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await walk(root);

  return {
    root,
    hasFile(relativePath: string) {
      return files.includes(normalizeInputPath(relativePath));
    },
    hasDir(relativePath: string) {
      return dirs.includes(normalizeInputPath(relativePath));
    },
    listFiles() {
      return [...files].sort();
    },
    listDirs() {
      return [...dirs].sort();
    },
    async readText(relativePath: string) {
      const normalized = normalizeInputPath(relativePath);
      if (!files.includes(normalized)) {
        throw new Error(`Cannot read missing project file: ${normalized}`);
      }

      const absolutePath = join(root, normalized);
      const fileStat = await stat(absolutePath);
      if (fileStat.size > 512_000) {
        throw new Error(`Refusing to read large project file: ${normalized}`);
      }

      return readFile(absolutePath, "utf8");
    },
  };
}

export function normalizeRelative(root: string, absolutePath: string): string {
  return relative(root, absolutePath).split(sep).join("/");
}

export function normalizeInputPath(relativePath: string): string {
  return relativePath.split(sep).join("/").replace(/^\.\//, "");
}
