'use strict';
import {DiagnosticCollection, window, workspace}  from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {Compiler} from './compiler';
import {ContractCollection} from './model/contractsCollection';
import { initialiseProject } from './projectService';
import { formatPath } from './util';

export function compileAllContracts(compiler: Compiler, diagnosticCollection: DiagnosticCollection) {

    // Check if is folder, if not stop we need to output to a bin folder on rootPath
    if (workspace.workspaceFolders[0] === undefined) {
        window.showWarningMessage('Please open a folder in Visual Studio Code as a workspace');
        return;
    }
    const rootPath = workspace.workspaceFolders[0].uri.fsPath;
    const packageDefaultDependenciesDirectory = workspace.getConfiguration('tonsolidity').get<string>('packageDefaultDependenciesDirectory');
    const packageDefaultDependenciesContractsDirectory = workspace.getConfiguration('tonsolidity').get<string>('packageDefaultDependenciesContractsDirectory');
    const compilationOptimisation = workspace.getConfiguration('tonsolidity').get<number>('compilerOptimization');

    const contractsCollection = new ContractCollection();
    const project = initialiseProject(rootPath, packageDefaultDependenciesDirectory, packageDefaultDependenciesContractsDirectory);
    let solidityPath = '**/*.sol';
    if (project.projectPackage.sol_sources !== undefined && project.projectPackage.sol_sources !== '') {
        solidityPath = project.projectPackage.sol_sources + '/' + solidityPath;
    }

    // TODO parse excluded files
    let excludePath = '**/bin/**';
    if (project.projectPackage.build_dir !== undefined || project.projectPackage.build_dir === '') {
        excludePath = '**/' + project.projectPackage.build_dir + '/**';
    }

    // Process open Text Documents first as it is faster (We might need to save them all first? Is this assumed?)
    workspace.textDocuments.forEach(document => {

        if (path.extname(document.fileName) === '.sol') {
            const contractPath = document.fileName;
            const contractCode = document.getText();
            contractsCollection.addContractAndResolveImports(contractPath, contractCode, project);
        }
    });

    // Find all the other sol files, to compile them (1000 maximum should be enough for now)
    const files = workspace.findFiles(solidityPath, excludePath, 1000);

    return files.then(documents => {

        documents.forEach(document => {
            const contractPath = document.fsPath;

            // have we got this already opened? used those instead
            if (!contractsCollection.containsContract(contractPath)) {
                const contractCode = fs.readFileSync(document.fsPath, 'utf8');
                contractsCollection.addContractAndResolveImports(contractPath, contractCode, project);
            }
        });
        const sourceDirPath = formatPath(project.projectPackage.getSolSourcesAbsolutePath());
        const packagesPath = formatPath(project.packagesDir);
        compiler.compile(contractsCollection.getDefaultContractsForCompilation(compilationOptimisation),
                diagnosticCollection,
                project.projectPackage.build_dir,
                project.projectPackage.absoluletPath,
                sourceDirPath,
                packagesPath);

    });
}


