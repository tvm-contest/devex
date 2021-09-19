'use strict';
import * as fs from 'fs';
import * as path from 'path';
import { errorToDiagnostic } from './solErrorsToDiagnostics';
import { Terminal, Component } from 'tondev';
import { ContractCollection } from './model/contractsCollection';
import { initialiseProject } from './projectService';

export class SolcCompiler {

    public rootPath: string;
    public _tondevTerminal: Terminal;
    private tondevTerminalOutput = [];
    
    constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    public isRootPathSet(): boolean {
        return typeof this.rootPath !== 'undefined' && this.rootPath !== null;
    }
   
    public tondevTerminal(): Terminal {
        if (!this._tondevTerminal) {
            this._tondevTerminal = {
                log: (...args: any[]) => {
                    this.tondevTerminalOutput.push(args.map((x) => `${x}`).join(""));
                },
                writeError: (text: string) => {
                    this.tondevTerminalOutput.push(text);
                },
                write: (text: string) => {
                    this.tondevTerminalOutput.push(text);
                },
            };
        }
        return this._tondevTerminal;
    }

    private async runCompilation(terminal: Terminal, args: {
        file: string,
        outputDir?: string,
    }): Promise<any[]> {
        const ext = path.extname(args.file);
        if (ext !== ".tsol") {
            terminal.log(`Choose TON solidity source file.`);
            return;
        }
        //await Component.ensureInstalledAll(terminal, components);
        const fileDir   = path.dirname(args.file);
        const fileName  = path.basename(args.file);
        const outputDir = path.resolve(args.outputDir ?? fileDir);
        const tvcName   = path.resolve(outputDir, fileName.replace(/\.[^/.]+$/, ".tvc"));
        const codeName  = path.resolve(outputDir, fileName.replace(/\.[^/.]+$/, ".code"));
        const compiler  = new Component("solidity", "solc", {
            isExecutable: true,
        });
        try {
            await compiler.silentRun(terminal, fileDir, ["-o", outputDir, fileName]);
        } catch(e) {
            //console.log(e);
        }
        const linker = new Component("solidity", "tvm_linker", {
            isExecutable: true,
            resolveVersionRegExp: /[^0-9]*([0-9.]+)/,
        });
        const stdlib = new class extends Component {
            getSourceName(version: string): string {
                return `${this.name}_${version.split(".").join("_")}.tvm.gz`;
            }
    
            async resolveVersion(downloadedVersion: string): Promise<string> {
                return downloadedVersion;
            }
    
            async loadAvailableVersions(): Promise<string[]> {
                return compiler.loadAvailableVersions();
            }
        }("solidity", "stdlib_sol", {
            targetName: "stdlib_sol.tvm",
        });
        try {
            const linkerOut = await linker.silentRun(
                terminal,
                fileDir,
                ["compile", codeName, "--lib", stdlib.path()],
            );
            const generatedTvcName = `${/Saved contract to file (.*)$/mg.exec(linkerOut)?.[1]}`;

            await new Promise((res, rej) =>
                fs.rename(path.resolve(fileDir, generatedTvcName),
                    path.resolve(outputDir, tvcName),
                    (err: Error) => (err ? rej(err) : res(true)),
                ),
            );
            fs.unlinkSync(path.resolve(fileDir, codeName));
        } catch(e) {
            //console.log(JSON.stringify(e));
        }
        return this.tondevTerminalOutput;
    }

    public async compile(contracts: any): Promise<any> {
        let rawErrors = [];
        this.tondevTerminalOutput = [];
        for (let fileNameId in contracts.sources) {
            //need to create temporary file and remove after saving
            let fileName  = path.basename(fileNameId);
            if (fileName.substr(0,1) == '~') { // we don't need to compile temp file
                continue;
            }
            const fileDir = path.dirname(fileNameId);
            fileName      = path.resolve(fileDir, "~" + fileName);
            try {
                fs.writeFileSync(fileName, contracts.sources[fileNameId].content, { flag: 'w' });
            } catch (err) {
                //console.error(JSON.stringify(err));
            }
            rawErrors = await this.runCompilation(this.tondevTerminal(), {"file": fileName});
        }
        let outputErrors = [];
        for (let i in rawErrors) {
            let errors = rawErrors[i].split(/\r\n\r\n/g);
            for(let j in errors) {
                let er = errors[j].split(/\r\n/g);
                if (er.length >= 5) {
                    const _er = er[0].split(/:/g);
                    const severity = _er[0];
                    const message = _er[1];
                    let sprep1 = er[1].replace(/  --> /g, "");
                    let prep1 = [];
                    for( let k = 2; k >= 0 ; k--) {
                        prep1.push(sprep1.substr(sprep1.lastIndexOf(":")+1));
                        sprep1 = sprep1.substr(0, sprep1.lastIndexOf(":"));
                    }
                    const file = sprep1;
                    const fileDir = path.dirname(file);
                    let fileName: string;
                    if (fileDir == ".") {
                        fileName  = file.substr(0, 1) === '~' ? file.substr(1): file;
                    } else {
                        fileName = path.basename(file);
                        fileName = fileName.substr(0, 1) === '~' ? fileName.substr(1): fileName;
                        fileName = path.resolve(fileDir, fileName);
                    }
                    const line = prep1[2];
                    const column = prep1[1];
                    outputErrors.push({"severity": severity, "message": message, "file": fileName, "length": (er[4].match(/\^/g)||[]).length, "line": line, "column": column});
                }
            }
        }
        
        return outputErrors;
    }

    public async compileSolidityDocumentAndGetDiagnosticErrors(filePath: string, documentText: string,
        packageDefaultDependenciesDirectory: string, packageDefaultDependenciesContractsDirectory: string) {
        if (this.isRootPathSet()) {
            const contracts = new ContractCollection();
            contracts.addContractAndResolveImports(
                filePath,
                documentText,
                initialiseProject(this.rootPath, packageDefaultDependenciesDirectory, packageDefaultDependenciesContractsDirectory));
            const contractsForCompilation = contracts.getDefaultContractsForCompilationDiagnostics();
            contractsForCompilation.settings = null;
            const output = await this.compile(contractsForCompilation);
            if (output) {
                return output
                    .map(error => errorToDiagnostic(error));
            }
        } else {
            const contract = {};
            contract[filePath] = documentText;
            const output = await this.compile({ sources: contract });
            if (output) {
                return output.map((error) => errorToDiagnostic(error));
            }
        }
        return [];
    }

}

