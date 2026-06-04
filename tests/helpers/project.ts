import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface FixtureProject {
  root: string;
}

export async function createFixtureProject(files: Record<string, string>): Promise<FixtureProject> {
  const root = await mkdtemp(join(tmpdir(), "agentpack-test-"));

  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(root, relativePath);
    await mkdir(join(absolutePath, ".."), { recursive: true });
    await writeFile(absolutePath, contents, "utf8");
  }

  return { root };
}
