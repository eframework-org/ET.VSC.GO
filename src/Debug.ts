//-------------------------------------------------//
//                    MIT License                  //
//    Copyright (c) 2025 EFramework Organization   //
//          SEE LICENSE.md FOR MORE DETAILS        //
//-------------------------------------------------//

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import { XFile, XLog, XString } from "ep.uni.util"
import { Target } from "./Define"

/**
 * Debug namespace handles all debugging operations, including launching, attaching, and managing debug sessions.
 * 
 * Debug 命名空间处理所有调试相关的操作, 包括启动、附加和管理调试会话.
 */
export namespace Debug {
    /**
     * Process launches debug sessions for multiple targets with progress tracking.
     * The function handles debug configurations, permissions, and session management.
     * 
     * 处理多个目标的调试会话启动, 包含进度跟踪. 该函数处理调试配置、权限和会话管理.
     * 
     * @param targets Array of Target objects containing debug configurations, 目标数组包含调试配置信息.
     * @returns Promise that resolves when all debug sessions start, Promise在所有调试会话启动时解析.
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

                    const env = "debug"
                    const incre = 1 / targets.length * 100

                    function processNext(idx: number) {
                        if (canceled) return

                        let root = vscode.workspace.rootPath
                        let target = targets[idx]
                        progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", target.ID, idx + 1, targets.length) })

                        let osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                        let exename = target.Os == "windows" ? target.Name + ".exe" : target.Name
                        let exepath: string = ""
                        if (target.BuildPath) {
                            exepath = path.isAbsolute(target.BuildPath) ?
                                path.join(target.BuildPath, osarch, env, target.Name) :
                                path.join(root, target.BuildPath, osarch, env, target.Name)
                        } else {
                            exepath = path.join(root, "bin", osarch, env, target.Name)
                        }
                        let exefile = path.join(exepath, exename)
                        let targetpath = ""
                        if (target.SrcPath) {
                            targetpath = path.isAbsolute(target.SrcPath) ? target.SrcPath : path.join(root, target.SrcPath)
                        } else {
                            targetpath = path.join(root, "src", target.Name)
                        }
                        let cplat = target.Os == "windows" ? "win32" : target.Os
                        if (cplat != process.platform) {
                            XLog.Error("debug {0} program on {1} is not supported", cplat, process.platform)
                        } else if (XFile.HasFile(exefile) == false) {
                            XLog.Error("Debug.Process: {0} doesn't exist", exefile)
                        } else {
                            try {
                                if (process.platform == "darwin") {
                                    child_process.execSync(XString.Format("chmod -R 777 {0}", exepath))
                                } else if (process.platform == "linux") {
                                    child_process.execSync(XString.Format("chmod -R 777 {0}", exepath))
                                }
                            } catch (err) {
                                XLog.Error("Debug.Process: chmod {0} err: {1}", targetpath, err)
                            }
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
                                        setTimeout(resolve, 800) // 等待进度条显示100%
                                    }
                                }, () => {
                                    if (idx < targets.length - 1) processNext(idx + 1)
                                    else {
                                        vscode.window.showInformationMessage(XString.Format("Debug {0} target(s) done.", targets.length))
                                        setTimeout(resolve, 800) // 等待进度条显示100%
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