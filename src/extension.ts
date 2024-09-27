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

        if (linePrefix.endsWith("add/")) {
          // Provide package names
          return packages.map((pack) => {
            const item = new vscode.CompletionItem(
              pack.name,
              vscode.CompletionItemKind.Module,
            );
            item.insertText = pack.name;
            const docs = new vscode.MarkdownString(pack.description);
            docs.isTrusted = true;
            item.documentation = docs;
            return item;
          });
        }

        const match = linePrefix.match(/add\/([^\/]+)\/$/);

        if (match) {
          // Provide module names for the specified package
          const packageName = match[1];
          const pack = packages.find((p) => p.name === packageName);

          if (pack) {
            return Promise.all(pack.modules.map(async (mod) => {
              const item = new vscode.CompletionItem(
                mod.name,
                vscode.CompletionItemKind.Module,
              );

              const docs = new vscode.MarkdownString(
                `${mod.description}\n\n[Preview](https://api.css.gal/${pack.name}/${mod.name})`,
              );
              docs.isTrusted = true;
              item.documentation = docs;
              item.command = {
                title: "Insert CSS code here",
                command: "cssgalore.insertCss",
                arguments: [
                  item,
                  `https://api.css.gal/${pack.name}/${mod.name}.css`,
                  pack,
                  mod,
                ],
              };
              item.additionalTextEdits = [
                vscode.TextEdit.delete(
                  new vscode.Range(
                    position.translate(0, -match[0].length),
                    position,
                  ),
                ),
              ];
              return item;
            }));
          }
        }

        return undefined;
      },
      async resolveCompletionItem(item: vscode.CompletionItem) {
        if (!item.command) {
          return item;
        }
        switch (item.command.command) {
          case "cssgalore.insertCss": {
            const [completionItem, url, pack, mod] = item.command.arguments!;
            const css = await getCss(url);
            const text = css.replaceAll(
              ".host",
              ".${1:" + pack.name + "_" + mod.name + "}",
            );
            completionItem.insertText = new vscode.SnippetString(text);
            return completionItem;
          }
        }
        return item;
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
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  return response.json();
}
async function getCss(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept": "text/css",
    },
  });

  return response.text();
}
