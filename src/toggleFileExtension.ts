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
                    fs.rename(files[index].fsPath, files[index].fsPath.replace('.sol', '.tsol'), (err) => {
                        if (err != null) {
                            console.log(err);
                        }
                    });
                }
            }
        } else {
            workspace.findFiles('**/*.tsol').then((files) => {
                for(let index in files) {
                    const filename = path.basename(files[index].fsPath);
                    if (filename.substr(0, 1) != '~') {
                        fs.rename(files[index].fsPath, files[index].fsPath.replace('.tsol', '.sol'), (err) => {
                            if (err != null) {
                                console.log(err);
                            }
                        });
                    }
                }
            });
        }
    });
}
