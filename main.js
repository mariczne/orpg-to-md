#!/usr/bin/env node

const fs = require("fs");

function convertToMarkdown(inputFile, outputFile) {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

    if (!data.version || data.version !== "orpg.1.0") {
      console.warn(`Warning: File may not be a valid ORPG export (expected version "orpg.1.0", got "${data.version || 'none'}")`);
    }

    let aiName = "AI";
    const characters = data.characters;
    if (Object.keys(characters).length > 0) {
      const firstChar = characters[Object.keys(characters)[0]];
      aiName = firstChar.modelInfo.short_name || firstChar.modelInfo.name || "AI";
    }

    const messages = Object.values(data.messages).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    let markdown = "";

    messages.forEach((message) => {
      if (message.characterId === "USER") {
        markdown += `#### You:\n${message.content}\n\n`;
      } else {
        markdown += `#### ${aiName}:\n${message.content}\n\n`;
      }
    });

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
