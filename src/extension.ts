import * as vscode from 'vscode';
import slugify from "slugify";

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('rename-markdown-heading.renameMarkdownHeading', async () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        const document = editor.document;
        const cursorPosition = editor.selection.active;
        const currentLine = document.lineAt(cursorPosition.line);

        // Check if the current line is a Markdown heading
        const headingMatch = currentLine.text.match(/^(#+)\s+(.*)$/);
        if (!headingMatch) {
          vscode.window.showErrorMessage("Current line is not a Markdown heading.");
          return;
        }

        const [_, hashes, oldHeading] = headingMatch;

        // Prompt the user for a new heading name
        const newHeading = await vscode.window.showInputBox({
          prompt: "Enter the new heading name",
          value: oldHeading,
        });
  
        if (!newHeading) {
          vscode.window.showInformationMessage("Rename cancelled.");
          return;
        }

        // Generate slugs
        const newSlug = slugify(newHeading, { lower: true, strict: true });
        const oldSlug = slugify(oldHeading, { lower: true, strict: true });

        const oldHeadingRange = new vscode.Range(
            cursorPosition.line,
            hashes.length + 1,
            cursorPosition.line,
            currentLine.text.length
          );

        editor.edit(editBuilder => {
            // Replace the heading text
            editBuilder.replace(oldHeadingRange, newHeading);

            // Update references in the file
            const markdownLinkRegex = new RegExp(`\\[.*?\\]\\(.*?#${oldSlug}\\)`, "g");
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const matches = line.text.matchAll(markdownLinkRegex);
                for (const match of matches) {
                    const matchStart = line.text.indexOf(match[0]);
                    const matchRange = new vscode.Range(
                        i,
                        matchStart,
                        i,
                        matchStart + match[0].length - 1
                    );
                
                    // Replace the old slug in the link with the new slug
                    const updatedLink = match[0].replace(
                        /#.+$/,
                        `#${newSlug}`
                    );
                    editBuilder.replace(matchRange, updatedLink);
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

