// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch from "node-fetch";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const patternNames = await await getJson(
    "https://css-patterns.deno.dev/",
  ) as string[];

  const patterns = await Promise.all(
    patternNames.map((name) =>
      getJson(`https://css-patterns.deno.dev/${name}`)
    ),
  ) as Pattern[];

  const completions = patterns.map((pattern) => {
    const snippet = new vscode.CompletionItem(`@ptr ${pattern.name}`);
    const text = pattern.style.replaceAll(
      ".host",
      ".${1:" + pattern.name + "}",
    );
    snippet.insertText = new vscode.SnippetString(text);
    const docs: any = new vscode.MarkdownString(`
    ${pattern.description}
    Preview: https://css-patterns.deno.dev/${pattern.name}
  `);
    snippet.documentation = docs;
    return snippet;
  });

  const patternsProvider = vscode.languages.registerCompletionItemProvider(
    "css",
    {
      provideCompletionItems() {
        return completions;
      },
    },
  );

  context.subscriptions.push(patternsProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}

interface Pattern {
  name: string;
  description?: string;
  style: string;
  content: string;
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  return response.json();
}
