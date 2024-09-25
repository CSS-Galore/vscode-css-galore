// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch from "node-fetch";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const packages = await await getJson(
    "https://api.css.gal/",
  ) as Package[];

  const completions: vscode.CompletionItem[] = [];

  for (const pack of packages) {
    for (const mod of pack.modules) {
      const snippet = new vscode.CompletionItem(
        `_css:${pack.name}/${mod.name}`,
      );
      const text = mod.css.replaceAll(
        ".host",
        ".${1:" + mod.name + "}",
      );
      snippet.insertText = new vscode.SnippetString(text);
      const docs: any = new vscode.MarkdownString(`
## ${pack.name}

${pack.description}

---

### ${mod.name}

${mod.description}

---

[Preview](https://api.css.gal/${pack.name}/${mod.name})
`);
      snippet.documentation = docs;
      completions.push(snippet);
    }
  }

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

interface Package {
  name: string;
  description: string;
  author: Author | Author[];
  modules: Module[];
}

interface Author {
  name: string;
  url: string;
}

interface Module {
  name: string;
  description: string;
  css: string;
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  return response.json();
}
