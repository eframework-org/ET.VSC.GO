// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import { XFile, XLog, XString } from "ep.uni.util"
import { Target } from "./Define"

/**
 * Debug 命名空间处理所有调试相关的操作。
 */
export namespace Debug {
    /**
     * 处理多个目标的调试会话启动。
     * @param targets 目标配置数组。
     * @returns Promise 在所有调试会话启动时解析。
     */
    export function Process(targets: Target[]) {
        if (targets == null || targets.length == 0) {
            XLog.Warn("Debug.Process: no target(s) was selected.")
            vscode.window.showInformationMessage("No target(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Debugging target(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>((resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Debugging target(s) has been canceled.")
                        reject("Debugging target(s) has been canceled.")
                    })

                    const env = "debug"     // 调试环境标识
                    const incre = 1 / targets.length * 100  // 每个目标的进度增量

                    /**
                     * 处理下一个调试目标。
                     * @param idx 当前处理的目标索引。
                     */
                    function processNext(idx: number) {
                        if (canceled) return

                        let root = vscode.workspace.rootPath
                        let target = targets[idx]
                        progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", target.ID, idx + 1, targets.length) })

                        // 准备调试环境和路径
                        const osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                        const exename = target.Os == "windows" ? target.Name + ".exe" : target.Name
                        const exepath = path.isAbsolute(target.BuildPath) ?
                            XFile.PathJoin(target.BuildPath, osarch, env, target.Name) :
                            XFile.PathJoin(root, target.BuildPath, osarch, env, target.Name)
                        const exefile = XFile.PathJoin(exepath, exename)
                        const targetpath = XFile.NormalizePath(path.isAbsolute(target.ScriptPath) ? target.ScriptPath : XFile.PathJoin(root, target.ScriptPath))

                        // 检查平台兼容性
                        const cplat = target.Os == "windows" ? "win32" : target.Os
                        if (cplat != process.platform) {
                            XLog.Error("debug {0} program on {1} is not supported", cplat, process.platform)
                        } else if (XFile.HasFile(exefile) == false) {
                            XLog.Error("Debug.Process: {0} doesn't exist", exefile)
                        } else {
                            try {
                                // 设置执行权限
                                if (process.platform == "darwin" || process.platform == "linux") {
                                    child_process.execSync(XString.Format("chmod -R 777 {0}", exepath))
                                }
                            } catch (err) {
                                XLog.Error("Debug.Process: chmod {0} err: {1}", targetpath, err)
                            }

                            // 启动调试会话
                            setTimeout(() => {
                                vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], {
                                    "name": target.ID,
                                    "type": "go",
                                    "request": "launch",
                                    "mode": "exec",
                                    "program": exefile,
                                    "cwd": exepath,
                                    "args": target.StartArgs ? target.StartArgs : [],
                                    "dlvFlags": target.DlvFlags ? target.DlvFlags : [],
                                }).then(() => {
                                    if (idx < targets.length - 1) processNext(idx + 1)
                                    else {
                                        vscode.window.showInformationMessage(XString.Format("Debug {0} target(s) done.", targets.length))
                                        setTimeout(resolve, 800) // 等待进度条显示完成
                                    }
                                }, () => {
                                    if (idx < targets.length - 1) processNext(idx + 1)
                                    else {
                                        vscode.window.showInformationMessage(XString.Format("Debug {0} target(s) done.", targets.length))
                                        setTimeout(resolve, 800) // 等待进度条显示完成
                                    }
                                })
                            }, target.StartDelay == null || idx == 0 ? 0 : target.StartDelay * 1000)
                        }
                    }

                    processNext(0)
                })
            })
        }
    }
}