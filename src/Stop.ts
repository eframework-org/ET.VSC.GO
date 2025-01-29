//-------------------------------------------------//
//                    MIT License                  //
//    Copyright (c) 2025 EFramework Organization   //
//          SEE LICENSE.md FOR MORE DETAILS        //
//-------------------------------------------------//

import * as vscode from "vscode"
import * as path from "path"
import * as killport from "kill-port"
import { XFile, XLog, XString } from "ep.uni.util"
import { Target } from "./Define"

/**
 * Stop namespace handles all termination operations, including process killing and cleanup.
 * 
 * Stop 命名空间处理所有终止相关的操作, 包括进程终止和清理.
 */
export namespace Stop {
    /**
     * Process terminates running targets with progress tracking and port cleanup.
     * The function handles debug session termination, port killing, and ensures proper cleanup of resources.
     * 
     * 处理运行中目标的终止过程, 包含进度跟踪和端口清理. 该函数处理调试会话终止、端口终止, 并确保资源正确清理.
     * 
     * @param targets Array of Target objects to terminate, 需要终止的目标数组.
     * @returns Promise that resolves when all targets are stopped, Promise在所有目标停止时解析.
     */
    export async function Process(targets: Target[]) {
        if (targets == null || targets.length == 0) {
            XLog.Warn("Stop.Process: no target(s) was selected.")
            vscode.window.showInformationMessage("No target(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Stopping target(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>((resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Stopping target(s) has been canceled.")
                        reject("Stopping target(s) has been canceled.")
                    })

                    if (mSessions == null) {
                        mSessions = new Map()
                        vscode.debug.onDidStartDebugSession((session) => {
                            if (session) {
                                if (mSessions.has(session.name)) {
                                    mSessions.delete(session.name)
                                    vscode.debug.stopDebugging(session)
                                }
                                mSessions.set(session.name, session)
                            }
                        })
                        vscode.debug.onDidTerminateDebugSession((session) => {
                            if (session) {
                                mSessions.delete(session.name)
                            }
                        })
                    }

                    const root = vscode.workspace.rootPath
                    let totalTime = 0
                    const incre = 1 / targets.length * 100

                    for (let i = 0; i < targets.length; i++) {
                        const target = targets[i]
                        const index = i
                        setTimeout(() => {
                            try {
                                if (!canceled) {
                                    const session = mSessions.get(target.ID)
                                    if (session) {
                                        vscode.debug.stopDebugging(session).then(() => {
                                            XLog.Error("Stop.Process({0}): finish kill proc by session.", target.ID)
                                            mSessions.delete(target.ID)
                                        }, (e) => {
                                            XLog.Info("Stop.Process({0}): kill proc by session failed: {1}", target.ID, e)
                                            mSessions.delete(target.ID)
                                        })
                                        XLog.Info("Stop.Process({0}): start kill proc by session.", target.ID)
                                    }
                                    if (target.StopPort) {
                                        function getPortF(env: string) {
                                            const osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                                            const exepath = path.isAbsolute(target.BuildPath) ?
                                                XFile.PathJoin(target.BuildPath, osarch, env, target.Name) :
                                                XFile.PathJoin(root, target.BuildPath, osarch, env, target.Name)
                                            return XFile.PathJoin(exepath, target.StopPort)
                                        }
                                        let portf = getPortF(session ? "debug" : "release")
                                        if (!XFile.HasFile(portf)) {
                                            XLog.Error("Stop.Process({0}): kill proc failed: port file doesn't exist: {1}", target.ID, portf)
                                            portf = getPortF("debug")
                                        }
                                        if (!XFile.HasFile(portf)) {
                                            XLog.Error("Stop.Process({0}): kill proc failed: port file doesn't exist: {1}", target.ID, portf)
                                        } else {
                                            var ctt = XFile.OpenText(portf)
                                            var lines = ctt.split("\n")
                                            for (let i = 0; i < lines.length; i++) {
                                                let port = parseInt(lines[i])
                                                if (isNaN(port) == false) {
                                                    try {
                                                        XLog.Info("Stop.Process({0}): start kill proc by port at {1}", target.ID, port)
                                                        killport(port, "tcp").then(() => {
                                                            XLog.Info("Stop.Process({0}): finish kill proc by port at {1}", target.ID, port)
                                                        }, e => {
                                                            XLog.Info("Stop.Process({0}): kill proc by port at {1} failed: {2}", target.ID, port, e)
                                                        })
                                                    } catch (err) {
                                                        XLog.Info("Stop.Process({0}): kill proc by port at {1} exception: {2}", target.ID, port, err)
                                                    }
                                                } else {
                                                    XLog.Info("Stop.Process({0}): kill proc failed: NaN port of {1}", target.ID, lines[i])
                                                }
                                            }
                                        }
                                    } else {
                                        XLog.Error("Stop.Process({0}): kill proc failed: missing 'stopPort' config.", target.ID)
                                    }
                                }
                            } catch (err) {
                                XLog.Error("Stop.Process({0}): kill proc unexpected: {1}", target.ID, err)
                            } finally {
                                progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", target.ID, index + 1, targets.length) })
                                if (index == targets.length - 1 || canceled) {
                                    vscode.window.showInformationMessage(XString.Format("Stop {0} target(s) done.", targets.length))
                                    setTimeout(resolve, 800) // 等待进度条显示100%
                                }
                            }
                        }, totalTime * 1000)
                        let stopDelay = target.StopDelay == null ? 0 : target.StopDelay
                        totalTime += stopDelay
                    }
                })
            })
        }
    }

    // Debug sessions map for tracking active sessions, 用于跟踪活动会话的调试会话映射.
    var mSessions: Map<string, vscode.DebugSession>
}