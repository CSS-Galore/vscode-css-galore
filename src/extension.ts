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

  const patternsProvider = vscode.languages.registerCompletionItemProvider(
    "css",
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
      ) {
        const linePrefix = document.lineAt(position).text.substr(
          0,
          position.character,
        );

        if (linePrefix.endsWith("/css/")) {
          // Provide package names
          return packages.map((pack) => {
            const item = new vscode.CompletionItem(
              pack.name,
              vscode.CompletionItemKind.Module,
            );
            item.insertText = pack.name;
            const docs = new vscode.MarkdownString(
              `## ${pack.name}\n\n${pack.description}`,
            );
            docs.isTrusted = true;
            item.documentation = docs;
            return item;
          });
        }

        const match = linePrefix.match(/css\/([^\/]+)\/$/);

        if (match) {
          // Provide module names for the specified package
          const packageName = match[1];
          const pack = packages.find((p) => p.name === packageName);

          if (pack) {
            return pack.modules.map((mod) => {
              const item = new vscode.CompletionItem(
                mod.name,
                vscode.CompletionItemKind.Module,
              );
              const text = mod.css.replaceAll(
                ".host",
                ".${1:" + pack.name + "_" + mod.name + "}",
              );
              item.insertText = new vscode.SnippetString(text);
              const docs = new vscode.MarkdownString(
                `## ${pack.name}/${mod.name}\n\n${mod.description}\n\n[Preview](https://api.css.gal/${pack.name}/${mod.name})`,
              );
              docs.isTrusted = true;
              item.documentation = docs;
              item.additionalTextEdits = [
                vscode.TextEdit.delete(
                  new vscode.Range(
                    position.translate(0, -(match[0].length + 1)),
                    position,
                  ),
                ),
              ];
              return item;
            });
          }
        }

        return undefined;
      },
    },
    "/", // Trigger character
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
