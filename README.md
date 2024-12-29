# orpg-to-md

[![npm version](https://badge.fury.io/js/orpg-to-md.svg)](https://badge.fury.io/js/orpg-to-md)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Convert OpenRouter chat export files (ORPG) to human-readable Markdown format.

## About ORPG Format

ORPG is the format used by OpenRouter to export chat conversations. At least it seems to be, as there doesn't seem to be any public information about the schema. It contains:

- Chat messages
- Model information
- Conversation metadata

The converter extracts the essential parts (messages and model names) and creates a readable Markdown file.

## Installation

```sh
npm install -g orpg-to-md # or your node package manager's equivalent
```

Make sure your $PATH is properly configured.

## Usage

This will convert the chat export to Markdown format.

```sh
orpg-to-md input-file.json [output-file.md]
```

By default, it creates a file with the same name as your input file but with .md extension. It can also be specified.

## License

This script is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
