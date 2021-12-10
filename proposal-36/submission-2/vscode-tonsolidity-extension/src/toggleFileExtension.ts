'use strict';
import { workspace, window, Range, WorkspaceEdit } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function toggleFileExtension() {
    workspace.findFiles('**/*.sol').then((files) => {
        if (files.length != 0) {
            for (let index in files) {
                const filename = path.basename(files[index].fsPath);
                if (filename.substr(0, 1) != '~') {
                    let content = fs.readFileSync(files[index].fsPath);
                    const repalcedContent = content.toString().replace(/\.sol"/, ".tsol\"");
                    fs.writeFileSync(files[index].fsPath, repalcedContent);
                    fs.rename(files[index].fsPath, files[index].fsPath.replace('.sol', '.tsol'), (err) => {
                        if (err != null) {
                            console.log(err);
                        }
                    });
                } else {
                    fs.unlinkSync(files[index].fsPath);
                }
            }
        } else {
            workspace.findFiles('**/*.tsol').then((files) => {
                for(let index in files) {
                    const filename = path.basename(files[index].fsPath);
                    if (filename.substr(0, 1) != '~') {
                        let content = fs.readFileSync(files[index].fsPath);
                        const repalcedContent = content.toString().replace(/\.tsol"/, ".sol\"");
                        fs.writeFileSync(files[index].fsPath, repalcedContent);
                        fs.rename(files[index].fsPath, files[index].fsPath.replace('.tsol', '.sol'), (err) => {
                            if (err != null) {
                                console.log(err);
                            }
                        });
                    } else {
                        fs.unlinkSync(files[index].fsPath);
                    }
                }
            });
        }
    });
}
