const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const exampleJson = {
  version: "orpg.1.0",
  characters: {
    "char-1735038715-DS8UZX2WvLJWGqaEBiot": {
      id: "char-1735038715-DS8UZX2WvLJWGqaEBiot",
      modelInfo: {
        short_name: "Claude 3.5 Haiku (2024-10-22) (self-moderated)"
      }
    }
  },
  messages: {
    "msg-1735169826-37r5gAcrK8YyOLIQvWRp": {
      characterId: "char-1735038715-DS8UZX2WvLJWGqaEBiot",
      content: "Let me help you count the r's in \"strawberry\":\n\nst*r*awbe*r*y\n\nThere are 2 r's in the word \"strawberry\".",
      updatedAt: "2024-12-25T23:37:07.790Z"
    },
    "msg-1735169826-GQZrG3EaTJqjOkJ1mIVE": {
      characterId: "USER",
      content: "How many r's are in the word strawberry?",
      updatedAt: "2024-12-25T23:37:06.203Z"
    }
  }
};

test("converts example.json correctly", async (t) => {
  const inputPath = path.join(__dirname, "temp-example.json");
  const outputPath = path.join(__dirname, "temp-example.md");

  fs.writeFileSync(inputPath, JSON.stringify(exampleJson));

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
  fs.unlinkSync(inputPath);
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
  const inputPath = path.join(__dirname, "temp-example.json");
  const customOutputPath = path.join(__dirname, "custom-output.md");

  fs.writeFileSync(inputPath, JSON.stringify(exampleJson));

  if (fs.existsSync(customOutputPath)) {
    fs.unlinkSync(customOutputPath);
  }

  execSync(`node ${path.resolve(__dirname, "../main.js")} "${inputPath}" "${customOutputPath}"`);
  assert.ok(fs.existsSync(customOutputPath), "Custom output file should be created");

  const content = fs.readFileSync(customOutputPath, "utf8");
  assert.ok(content.includes("#### You:"), "Should contain user messages");
  assert.ok(content.includes("#### Claude"), "Should contain AI messages");

  fs.unlinkSync(customOutputPath);
  fs.unlinkSync(inputPath);
});

test("warns about incorrect version", async (t) => {
  const invalidVersionPath = path.join(__dirname, "invalid-version.json");
  fs.writeFileSync(invalidVersionPath, JSON.stringify({
    version: "orpg.2.0",
    characters: {},
    messages: {}
  }));

  try {
    execSync(
      `node ${path.join(__dirname, "../main.js")} ${invalidVersionPath}`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (error) {
    const stderr = error.stderr.toString();
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

test("handles multiple AI in conversation", async (t) => {
  const multiAIPath = path.join(__dirname, "multi-ai.json");
  const multiAIOutput = path.join(__dirname, "multi-ai.md");
  
  fs.writeFileSync(multiAIPath, JSON.stringify({
    version: "orpg.1.0",
    characters: {
      "char-1": {
        id: "char-1",
        modelInfo: {
          short_name: "Claude 3.5 Haiku (2024-10-22) (self-moderated)"
        }
      },
      "char-2": {
        id: "char-2",
        modelInfo: {
          short_name: "GPT-4 (2024-03)"
        }
      }
    },
    messages: {
      "msg-1": {
        characterId: "USER",
        content: "Hello",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      "msg-2": {
        characterId: "char-1",
        content: "Hi from Claude",
        updatedAt: "2024-01-01T00:00:01Z"
      },
      "msg-3": {
        characterId: "char-2",
        content: "Hi from GPT",
        updatedAt: "2024-01-01T00:00:02Z"
      }
    }
  }));

  try {
    execSync(`node ${path.resolve(__dirname, "../main.js")} "${multiAIPath}"`);
    assert.ok(fs.existsSync(multiAIOutput), "Output file should be created");

    const content = fs.readFileSync(multiAIOutput, "utf8");
    assert.ok(content.includes("#### You:"), "Should contain user messages");
    assert.ok(
      content.includes("#### Claude 3.5 Haiku (2024-10-22) (self-moderated):"),
      "Should contain first AI message with correct name"
    );
    assert.ok(
      content.includes("#### GPT-4 (2024-03):"),
      "Should contain second AI message with correct name"
    );
  } finally {
    if (fs.existsSync(multiAIPath)) fs.unlinkSync(multiAIPath);
    if (fs.existsSync(multiAIOutput)) fs.unlinkSync(multiAIOutput);
  }
});
