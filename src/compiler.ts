'use strict';

import { OutputChannel, DiagnosticCollection, window, workspace } from 'vscode';
import { SolcCompiler } from './solcCompiler';
import { errorsToDiagnostics } from './solErrorsToDiaganosticsClient';

export class Compiler {
    private outputChannel: OutputChannel;
    private solc: SolcCompiler;

    constructor() {
        this.outputChannel = window.createOutputChannel('Ton solidity compiler');
    }

    public async compile(contracts: any,
                        diagnosticCollection: DiagnosticCollection,
                        buildDir: string, rootDir: string, sourceDir: string, excludePath?: string,
                        singleContractFilePath?: string): Promise<Array<string>> {
        // Did we find any tsol files after all?
        if (Object.keys(contracts).length === 0) {
            window.showWarningMessage('No solidity files (*.tsol) found');
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                const output = this.solc.compile(JSON.stringify(contracts));
                resolve(this.processCompilationOutput(output, this.outputChannel, diagnosticCollection, buildDir,
                    sourceDir, excludePath, singleContractFilePath));
            } catch (reason) {
                window.showWarningMessage(reason);
                reject(reason);
            }
        });
    }

    private outputErrorsToChannel(outputChannel: OutputChannel, errors: any) {
        errors.forEach(error => {
            outputChannel.appendLine(error.formattedMessage);
        });
        outputChannel.show();
    }

    private processCompilationOutput(outputString: any, outputChannel: OutputChannel, diagnosticCollection: DiagnosticCollection,
        buildDir: string, sourceDir: string, excludePath?: string, singleContractFilePath?: string): Array<string> {
        const output = JSON.parse(outputString);
        if (Object.keys(output).length === 0) {
            const noOutputMessage = `No output by the compiler`;
            window.showWarningMessage(noOutputMessage);
            window.setStatusBarMessage(noOutputMessage);
            outputChannel.appendLine(noOutputMessage);
            return;
        }

        diagnosticCollection.clear();

        if (output.errors) {
            const errorWarningCounts = errorsToDiagnostics(diagnosticCollection, output.errors);
            this.outputErrorsToChannel(outputChannel, output.errors);

            if (errorWarningCounts.errors > 0) {
                const compilationWithErrorsMessage = `Compilation failed with ${errorWarningCounts.errors} errors`;
                window.showErrorMessage(compilationWithErrorsMessage);
                window.setStatusBarMessage(compilationWithErrorsMessage);
                outputChannel.appendLine(compilationWithErrorsMessage);
                if (errorWarningCounts.warnings > 0) {
                    window.showWarningMessage(`Compilation had ${errorWarningCounts.warnings} warnings`);
                }
            } else if (errorWarningCounts.warnings > 0) {
                const compilationWithWarningsMessage = `Compilation completed successfully!, with ${errorWarningCounts.warnings} warnings`;
                window.showWarningMessage(compilationWithWarningsMessage);
                window.setStatusBarMessage(compilationWithWarningsMessage);
                outputChannel.appendLine(compilationWithWarningsMessage);
                return [];
            }
        } else {
            const compilationSuccessMessage = `Compilation completed successfully!`;
            window.showInformationMessage(compilationSuccessMessage);
            window.setStatusBarMessage(compilationSuccessMessage);
            outputChannel.appendLine(compilationSuccessMessage);
            return [];
        }
    }
}
