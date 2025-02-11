// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import { XFile, XLog, XString } from "ep.uni.util"
import { Project } from "./Define"

/**
 * Debug 命名空间处理所有调试相关的操作。
 * 提供项目的调试、断点管理等功能。
 * @namespace
 */
export namespace Debug {
    /**
     * 处理多个项目的调试会话启动。
     * @param projects 项目配置数组。
     * @returns Promise 在所有调试会话启动时解析。
     */
    export function Process(projects: Project[]) {
        if (projects == null || projects.length == 0) {
            XLog.Warn("Debug.Process: no project(s) was selected.")
            vscode.window.showInformationMessage("No project(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Debugging project(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>((resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Debugging project(s) has been canceled.")
                        reject("Debugging project(s) has been canceled.")
                    })

                    const env = "debug"     // 调试环境标识
                    const incre = 1 / projects.length * 100  // 每个项目的进度增量

                    /**
                     * 处理下一个调试项目。
                     * @param idx 当前处理的项目索引。
                     */
                    function processNext(idx: number) {
                        if (canceled) return

                        let root = vscode.workspace.rootPath
                        let project = projects[idx]
                        progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", project.ID, idx + 1, projects.length) })

                        // 准备调试环境和路径
                        const osarch = XString.Format("{0}_{1}", project.Os, project.Arch)
                        const exename = project.Os == "windows" ? project.Name + ".exe" : project.Name
                        const exepath = path.isAbsolute(project.BuildPath) ?
                            XFile.PathJoin(project.BuildPath, osarch, env, project.Name) :
                            XFile.PathJoin(root, project.BuildPath, osarch, env, project.Name)
                        const exefile = XFile.PathJoin(exepath, exename)
                        const projpath = XFile.NormalizePath(path.isAbsolute(project.ScriptPath) ? project.ScriptPath : XFile.PathJoin(root, project.ScriptPath))

                        // 检查平台兼容性
                        const cplat = project.Os == "windows" ? "win32" : project.Os
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
                                XLog.Error("Debug.Process: chmod {0} err: {1}", projpath, err)
                            }

                            // 启动调试会话
                            setTimeout(() => {
                                vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], {
                                    "name": project.ID,
                                    "type": "go",
                                    "request": "launch",
                                    "mode": "exec",
                                    "program": exefile,
                                    "cwd": exepath,
                                    "args": project.StartArgs ? project.StartArgs : [],
                                    "dlvFlags": project.DlvFlags ? project.DlvFlags : [],
                                }).then(() => {
                                    if (idx < projects.length - 1) processNext(idx + 1)
                                    else {
                                        vscode.window.showInformationMessage(XString.Format("Debug {0} project(s) done.", projects.length))
                                        setTimeout(resolve, 800) // 等待进度条显示完成
                                    }
                                }, () => {
                                    if (idx < projects.length - 1) processNext(idx + 1)
                                    else {
                                        vscode.window.showInformationMessage(XString.Format("Debug {0} project(s) done.", projects.length))
                                        setTimeout(resolve, 800) // 等待进度条显示完成
                                    }
                                })
                            }, project.StartDelay == null || idx == 0 ? 0 : project.StartDelay * 1000)
                        }
                    }

                    processNext(0)
                })
            })
        }
    }
}