'use strict';
import SoliumService from './solium';
import { workspace, window, Range, WorkspaceEdit } from 'vscode';

export function lintAndfixCurrentDocument() {
    const soliumRules = workspace.getConfiguration('tonsolidity').get<string>('soliumRules');
    const linter = new SoliumService(
        workspace.workspaceFolders[0].uri.toString(), soliumRules, null);
    const editor = window.activeTextEditor;
    const sourceCode =  editor.document.getText();
    const fullRange = new Range(
        editor.document.positionAt(0),
        editor.document.positionAt(sourceCode.length),
    );

    const result = linter.lintAndFix(sourceCode);
    console.log(result);
    const edit = new WorkspaceEdit();
    edit.replace(editor.document.uri, fullRange, result.fixedSourceCode);
    return workspace.applyEdit(edit);
}
