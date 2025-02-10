// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import { XLog, XString, XUtility } from "ep.uni.util"
import { Target } from "./Define"
import { XFile } from "ep.uni.util"

/**
 * Start 命名空间处理所有启动相关的操作。
 * 提供目标程序的启动、参数配置等功能。
 * @namespace
 */
export namespace Start {
    /**
     * 处理多个目标的启动过程。
     * @param targets 目标配置数组。
     * @returns Promise 在所有目标启动时解析。
     */
    export async function Process(targets: Target[]) {
        if (targets == null || targets.length == 0) {
            XLog.Warn("Start.Process: no target(s) was selected.")
            vscode.window.showInformationMessage("No target(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Starting target(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>((resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Starting target(s) has been canceled.")
                        reject("Starting target(s) has been canceled.")
                    })

                    let totalTime = 0        // 累计延迟时间
                    const envstr = "release" // 发布环境标识
                    const incre = 1 / targets.length * 100  // 每个目标的进度增量

                    // 遍历处理每个目标
                    for (let i = 0; i < targets.length; i++) {
                        const index = i
                        const target = targets[i]
                        const root = vscode.workspace.rootPath

                        // 准备启动环境和路径
                        const osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                        const exename = target.Os == "windows" ? target.Name + ".exe" : target.Name
                        const exepath = path.isAbsolute(target.BuildPath) ?
                            XFile.PathJoin(target.BuildPath, osarch, envstr, target.Name) :
                            XFile.PathJoin(root, target.BuildPath, osarch, envstr, target.Name)
                        const exefile = XFile.PathJoin(exepath, exename)

                        setTimeout(() => {
                            try {
                                if (!canceled) {
                                    // 检查平台兼容性
                                    const cplat = target.Os == "windows" ? "win32" : target.Os
                                    if (cplat != process.platform) {
                                        XLog.Error("Start.Process({0}): program on {1} was not supported.", cplat, process.platform)
                                    } else {
                                        // 准备启动命令
                                        let cmd = ""
                                        let opt = XUtility.ExecOpt(exepath)
                                        if (process.platform == "win32") {
                                            cmd = XString.Format("start {0}", exefile)
                                        } else if (process.platform == "darwin") {
                                            // 设置执行权限
                                            child_process.execSync(XString.Format("chmod -R 777 {0}", exepath))
                                            cmd = XString.Format("echo \"cd {0}\n{1}\" > /tmp/{2}; chmod 777 /tmp/{3}; open -a Terminal /tmp/{4}", exepath, exefile, exename, exename, exename)
                                            // XLog.Info("Tips: go to [Terminal/Preferences/Profile/Shell] and set auto close when terminal is finished.")
                                            // [20230424]：设置终端结束后自动关闭[Terminal/Preferences/Profile/Shell]
                                        } else if (process.platform == "linux") {
                                            // 设置执行权限
                                            child_process.execSync(XString.Format("chmod -R 777 {0}", exepath))
                                            cmd = exefile
                                        }

                                        // 添加启动参数
                                        if (target.StartArgs && target.StartArgs.length > 0) {
                                            for (let i = 0; i < target.StartArgs.length; i++) {
                                                cmd += " " + target.StartArgs[i]
                                            }
                                        }

                                        XLog.Info("Start.Process({0}): {1}", target.ID, cmd)

                                        // 执行启动命令
                                        child_process.exec(cmd, opt, (error, stdout, stderr) => {
                                            if (error) XLog.Error(error)
                                            if (stdout) XLog.Info(stdout)
                                            if (stderr) XLog.Info(stderr)
                                        })
                                    }
                                }
                            } catch (error) {
                                XLog.Error("Start.Process({0}): unexpected: {1}", target.ID, error)
                            } finally {
                                progress.report({ increment: incre, message: XString.Format("{0} ({1} of {2})", target.ID, index + 1, targets.length) })
                                if (index == targets.length - 1 || canceled) {
                                    vscode.window.showInformationMessage(XString.Format("Start {0} target(s) done.", targets.length))
                                    setTimeout(resolve, 800) // 等待进度条显示完成
                                }
                            }
                        }, totalTime * 1000)

                        // 计算下一个目标的延迟时间
                        let startDelay = target.StartDelay == null ? 0 : target.StartDelay
                        totalTime += startDelay
                    }
                })
            })
        }
    }
}