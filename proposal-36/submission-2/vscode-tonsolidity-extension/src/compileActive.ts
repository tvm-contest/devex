'use strict';
import { DiagnosticCollection, window, workspace } from 'vscode';
import * as path from 'path';
import {Compiler} from './compiler';
import {ContractCollection} from './model/contractsCollection';
import { initialiseProject } from './projectService';
import { formatPath } from './util';

let diagnosticCollection: DiagnosticCollection;

export function initDiagnosticCollection(diagnostics: DiagnosticCollection) {
    diagnosticCollection = diagnostics;
}

export function compileActiveContract(compiler: Compiler): Promise<Array<string>> {
    const editor = window.activeTextEditor;

    if (!editor) {
        return; // We need something open
    }

    if (path.extname(editor.document.fileName) !== '.tsol' ||
        path.extname(editor.document.fileName) !== '.sol') {
        window.showWarningMessage('This not a ton solidity file (*.tsol or *.sol)');
        return;
    }

    // Check if is folder, if not stop we need to output to a bin folder on rootPath
    if (workspace.workspaceFolders[0] === undefined) {
        window.showWarningMessage('Please open a folder in Visual Studio Code as a workspace');
        return;
    }

    const contractsCollection = new ContractCollection();
    const contractCode = editor.document.getText();
    const contractPath = editor.document.fileName;

    const packageDefaultDependenciesDirectory = workspace.getConfiguration('tonsolidity').get<string>('packageDefaultDependenciesDirectory');
    const packageDefaultDependenciesContractsDirectory = workspace.getConfiguration('tonsolidity').get<string>('packageDefaultDependenciesContractsDirectory');
    const compilationOptimisation = workspace.getConfiguration('tonsolidity').get<number>('compilerOptimization');
    const project = initialiseProject(workspace.workspaceFolders[0].uri.fsPath, packageDefaultDependenciesDirectory, packageDefaultDependenciesContractsDirectory);
    const contract = contractsCollection.addContractAndResolveImports(contractPath, contractCode, project);
    const packagesPath = formatPath(project.packagesDir);

    return compiler.compile(contractsCollection.getDefaultContractsForCompilation(compilationOptimisation),
            diagnosticCollection,
            project.projectPackage.build_dir,
            project.projectPackage.absoluletPath,
            null,
            packagesPath,
            contract.absolutePath);
}
