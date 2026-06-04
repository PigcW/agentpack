import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";

describe("createProjectContext", () => {
  it("reads only relative project paths and never returns file contents by default", async () => {
    const project = await createFixtureProject({
      "AGENTS.md": "Run: npm run dev\nTest: npm test\n",
      ".env": "SECRET=hidden",
    });

    const context = await createProjectContext(project.root);

    expect(context.hasFile("AGENTS.md")).toBe(true);
    expect(context.hasFile(".env")).toBe(true);
    expect(context.listFiles()).toEqual(expect.arrayContaining(["AGENTS.md", ".env"]));
    expect(context.listFiles()).not.toContain("SECRET=hidden");
  });
});
