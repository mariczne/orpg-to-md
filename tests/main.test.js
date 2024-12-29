const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

test("converts example.json correctly", async (t) => {
  const inputPath = path.resolve(__dirname, "example.json");
  const outputPath = path.resolve(__dirname, "example.md");

  assert.ok(fs.existsSync(inputPath), `Test file not found at ${inputPath}`);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  execSync(`node ${path.resolve(__dirname, "../main.js")} "${inputPath}"`);
  assert.ok(fs.existsSync(outputPath), "Output file should be created");

  const content = fs.readFileSync(outputPath, "utf8");
  assert.ok(content.includes("#### You:"), "Should contain user messages");
  assert.ok(
    content.includes("#### Claude 3.5 Haiku (2024-10-22) (self-moderated):"),
    "Should contain AI messages with correct name"
  );
  assert.ok(content.includes("How many r's are in the word strawberry?"), "Should contain user question");
  assert.ok(content.match(/There are 2 r's in the word "strawberry"/), "Should contain AI response");

  fs.unlinkSync(outputPath);
});

test("handles missing input file", async (t) => {
  try {
    execSync(`node ${path.join(__dirname, "../main.js")}`);
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.ok(error.toString().includes("Please provide an input file"));
  }
});

test("handles invalid JSON file", async (t) => {
  const invalidPath = path.join(__dirname, "invalid.json");
  fs.writeFileSync(invalidPath, "not json");

  try {
    execSync(`node ${path.join(__dirname, "../main.js")} ${invalidPath}`, {
      stdio: "pipe",
    });
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.ok(
      error.stderr.toString().includes("Error: File doesn't appear to be a valid JSON file"),
      "Should show user-friendly error message"
    );
    assert.strictEqual(error.status, 1, "Should exit with code 1");
  }

  fs.unlinkSync(invalidPath);
});

test("supports custom output filename", async (t) => {
  const inputPath = path.resolve(__dirname, "example.json");
  const customOutputPath = path.resolve(__dirname, "custom-output.md");

  if (fs.existsSync(customOutputPath)) {
    fs.unlinkSync(customOutputPath);
  }

  execSync(`node ${path.resolve(__dirname, "../main.js")} "${inputPath}" "${customOutputPath}"`);
  assert.ok(fs.existsSync(customOutputPath), "Custom output file should be created");

  const content = fs.readFileSync(customOutputPath, "utf8");
  assert.ok(content.includes("#### You:"), "Should contain user messages");
  assert.ok(content.includes("#### Claude"), "Should contain AI messages");

  fs.unlinkSync(customOutputPath);
});

test("warns about incorrect version", async (t) => {
  const invalidVersionPath = path.join(__dirname, "invalid-version.json");
  fs.writeFileSync(invalidVersionPath, JSON.stringify({
    version: "orpg.2.0",
    characters: {},
    messages: {}
  }));

  try {
    const output = execSync(
      `node ${path.join(__dirname, "../main.js")} ${invalidVersionPath}`,
      { stdio: 'pipe' }
    );
    const stderr = output.stderr ? output.stderr.toString() : '';
    assert.ok(
      stderr.includes('Warning: File may not be a valid ORPG export'),
      "Should warn about invalid version"
    );
  } finally {
    fs.unlinkSync(invalidVersionPath);
    if (fs.existsSync(invalidVersionPath.replace('.json', '.md'))) {
      fs.unlinkSync(invalidVersionPath.replace('.json', '.md'));
    }
  }
});
