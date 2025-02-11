// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as vscode from "vscode"
import * as path from "path"
import * as killport from "kill-port"
import { XFile, XLog, XString } from "ep.uni.util"
import { Project } from "./Define"

/**
 * Stop 命名空间处理所有终止相关的操作。
 * 提供项目的停止、端口释放等功能。
 * @namespace
 */
export namespace Stop {
    /** 用于跟踪活动调试会话的映射。 */
    var sessions: Map<string, vscode.DebugSession>

    /**
     * 处理运行中项目的终止过程。
     * @param projects 需要终止的项目数组。
     * @returns Promise 在所有项目停止时解析。
     */
    export async function Process(projects: Project[]) {
        if (projects == null || projects.length == 0) {
            XLog.Warn("Stop.Process: no project(s) was selected.")
            vscode.window.showInformationMessage("No project(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Stopping project(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>((resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Stopping project(s) has been canceled.")
                        reject("Stopping project(s) has been canceled.")
                    })

                    // 初始化调试会话管理
                    if (sessions == null) {
                        sessions = new Map()
                        vscode.debug.onDidStartDebugSession((session) => {
                            if (session) {
                                if (sessions.has(session.name)) {
                                    sessions.delete(session.name)
                                    vscode.debug.stopDebugging(session)
                                }
                                sessions.set(session.name, session)
                            }
                        })
                        vscode.debug.onDidTerminateDebugSession((session) => {
                            if (session) {
                                sessions.delete(session.name)
                            }
                        })
                    }

                    const root = vscode.workspace.rootPath
                    let totalTime = 0        // 累计延迟时间
                    const incre = 1 / projects.length * 100  // 每个项目的进度增量

                    // 遍历处理每个项目
                    for (let i = 0; i < projects.length; i++) {
                        const project = projects[i]
                        const index = i
                        setTimeout(() => {
                            try {
                                if (!canceled) {
                                    // 尝试通过调试会话终止
                                    const session = sessions.get(project.ID)
                                    if (session) {
                                        vscode.debug.stopDebugging(session).then(() => {
                                            XLog.Error("Stop.Process({0}): finish kill proc by session.", project.ID)
                                            sessions.delete(project.ID)
                                        }, (e) => {
                                            XLog.Info("Stop.Process({0}): kill proc by session failed: {1}", project.ID, e)
                                            sessions.delete(project.ID)
                                        })
                                        XLog.Info("Stop.Process({0}): start kill proc by session.", project.ID)
                                    }

                                    // 尝试通过端口终止
                                    if (project.StopPort) {
                                        /**
                                         * 获取端口文件路径。
                                         * @param env 环境标识（debug/release）。
                                         * @returns 返回端口文件的完整路径。
                                         */
                                        function getPortF(env: string) {
                                            const osarch = XString.Format("{0}_{1}", project.Os, project.Arch)
                                            const exepath = path.isAbsolute(project.BuildPath) ?
                                                XFile.PathJoin(project.BuildPath, osarch, env, project.Name) :
                                                XFile.PathJoin(root, project.BuildPath, osarch, env, project.Name)
                                            return XFile.PathJoin(exepath, project.StopPort)
                                        }

                                        // 尝试读取端口文件
                                        let portf = getPortF(session ? "debug" : "release")
                                        if (!XFile.HasFile(portf)) {
                                            XLog.Error("Stop.Process({0}): kill proc failed: port file doesn't exist: {1}", project.ID, portf)
                                            portf = getPortF("debug")
                                        }
                                        if (!XFile.HasFile(portf)) {
                                            XLog.Error("Stop.Process({0}): kill proc failed: port file doesn't exist: {1}", project.ID, portf)
                                        } else {
                                            // 读取并处理端口列表
                                            var ctt = XFile.OpenText(portf)
                                            var lines = ctt.split("\n")
                                            for (let i = 0; i < lines.length; i++) {
                                                let port = parseInt(lines[i])
                                                if (isNaN(port) == false) {
                                                    try {
                                                        XLog.Info("Stop.Process({0}): start kill proc by port at {1}", project.ID, port)
                                                        killport(port, "tcp").then(() => {
                                                            XLog.Info("Stop.Process({0}): finish kill proc by port at {1}", project.ID, port)
                                                        }, e => {
                                                            XLog.Info("Stop.Process({0}): kill proc by port at {1} failed: {2}", project.ID, port, e)
                                                        })
                                                    } catch (err) {
                                                        XLog.Info("Stop.Process({0}): kill proc by port at {1} exception: {2}", project.ID, port, err)
                                                    }
                                                } else {
                                                    XLog.Info("Stop.Process({0}): kill proc failed: NaN port of {1}", project.ID, lines[i])
                                                }
                                            }
                                        }
                                    } else {
                                        XLog.Error("Stop.Process({0}): kill proc failed: missing 'stopPort' config.", project.ID)
                                    }
                                }
                            } catch (err) {
                                XLog.Error("Stop.Process({0}): kill proc unexpected: {1}", project.ID, err)
                            } finally {
                                progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", project.ID, index + 1, projects.length) })
                                if (index == projects.length - 1 || canceled) {
                                    vscode.window.showInformationMessage(XString.Format("Stop {0} project(s) done.", projects.length))
                                    setTimeout(resolve, 800) // 等待进度条显示完成
                                }
                            }
                        }, totalTime * 1000)

                        // 计算下一个项目的延迟时间
                        let stopDelay = project.StopDelay == null ? 0 : project.StopDelay
                        totalTime += stopDelay
                    }
                })
            })
        }
    }
}