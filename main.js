#!/usr/bin/env node

const fs = require("fs");

function convertMessageToMarkdown(message, characters) {
  const isUser = message.characterId === "USER";
  const prefix = isUser ? "#### You:" : `#### ${getAIName(message.characterId, characters)}:`;
  return `${prefix}\n\n${message.content}\n\n`;
}

function getAIName(characterId, characters) {
  const modelInfo = characters[characterId]?.modelInfo;
  if (!modelInfo) return "AI";

  const name = modelInfo.short_name || modelInfo.name || "AI";
  return name;
}

function processMessages(data) {
  const messages = Object.values(data.messages)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  let markdown = '';
  for (const message of messages) {
    markdown += convertMessageToMarkdown(message, data.characters);
  }
  return markdown;
}

function convertToMarkdown(inputFile, outputFile) {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

    if (!data.version || data.version !== "orpg.1.0") {
      console.warn(
        `Warning: File may not be a valid ORPG export (expected version "orpg.1.0", got "${data.version || "none"}")`
      );
    }

    const markdown = processMessages(data);

    const finalOutputFile = outputFile || inputFile.replace(/\.[^.]+$/, ".md");
    fs.writeFileSync(finalOutputFile, markdown);
    console.log(`Converted ${inputFile} to ${finalOutputFile}`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error: File doesn't appear to be a valid JSON file");
      process.exit(1);
    }
    throw error;
  }
}

const [inputFile, outputFile] = process.argv.slice(2);

if (!inputFile) {
  console.error("Please provide an input file");
  process.exit(1);
}

convertToMarkdown(inputFile, outputFile);
