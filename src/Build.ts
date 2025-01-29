//-------------------------------------------------//
//                    MIT License                  //
//    Copyright (c) 2025 EFramework Organization   //
//          SEE LICENSE.md FOR MORE DETAILS        //
//-------------------------------------------------//

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import * as glob from "glob"
import { XFile, XLog, XString, XUtility } from "ep.uni.util"
import { Target } from "./Define"

/**
 * Build 命名空间处理所有构建相关的操作。
 */
export namespace Build {
    /**
     * 处理多个目标的构建任务。
     * @param targets 目标配置数组。
     * @param debug 是否为调试构建。
     * @returns Promise 在所有构建完成时解析。
     */
    export async function Process(targets: Target[], debug: boolean): Promise<void> {
        if (targets == null || targets.length == 0) {
            XLog.Warn("Build.Process: no target(s) was selected.")
            vscode.window.showInformationMessage("No target(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Building target(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>(async (resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Building target(s) has been canceled.")
                        reject("Building target(s) has been canceled.")
                    })

                    let done = 0            // 已完成数量
                    let succeed = 0         // 成功数量
                    let failed: string[] = []   // 失败的目标ID
                    let index = 0           // 当前处理的索引
                    let target: Target      // 当前处理的目标
                    const incre = 1 / targets.length * 100  // 每个目标的进度增量

                    /**
                     * 处理构建完成后的状态更新。
                     * @param err 构建过程中的错误（如果有）。
                     */
                    function postBuild(err?: Error) {
                        done++
                        progress.report({ increment: incre * 0.8, message: XString.Format("{0} ({1} of {2})", target.ID, done, targets.length) })

                        if (err) {
                            failed.push(target.ID)
                            XLog.Error("Build.Process({0}): build failed: {1}", target.ID, err)
                        } else {
                            succeed++
                            XLog.Info("Build.Process({0}): build succeed.", target.ID)
                        }

                        // 检查是否所有目标都已处理完成
                        if (done >= targets.length || canceled) {
                            let str = ""
                            if (failed.length == 0) {
                                str = XString.Format("Build {0} target(s) succeed.", done)
                                vscode.window.showInformationMessage(str)
                            } else {
                                str = XString.Format("Build {0} target(s) succeed, failed({1}): {2}.", succeed, failed.length, failed.join(", "))
                                vscode.window.showErrorMessage(str)
                            }
                            setTimeout(resolve, 800) // 等待进度条显示完成
                        } else {
                            index++
                            handleBuild()
                        }
                    }

                    /**
                     * 处理单个目标的构建过程。
                     * 包括环境准备、执行构建和资源复制。
                     */
                    function handleBuild() {
                        target = targets[index]
                        progress.report({ increment: incre * 0.2, message: XString.Format("{0} ({1} of {2})", target.ID, done + 1, targets.length) })

                        // 准备构建环境和路径
                        const envstr = debug ? "debug" : "release"
                        const root = vscode.workspace.rootPath
                        const osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                        const exename = target.Os == "windows" ? target.Name + ".exe" : target.Name
                        const targetpath = XFile.NormalizePath(path.isAbsolute(target.ScriptPath) ? target.ScriptPath : XFile.PathJoin(root, target.ScriptPath))
                        const exepath = path.isAbsolute(target.BuildPath) ?
                            XFile.PathJoin(target.BuildPath, osarch, envstr, target.Name) :
                            XFile.PathJoin(root, target.BuildPath, osarch, envstr, target.Name)
                        const exefile = XFile.PathJoin(exepath, exename)

                        // 构建命令准备
                        let cmd = debug ?
                            "go build -gcflags=\"all=-N -l\"" :  // 调试模式：保留符号表
                            "go build -ldflags=\"-w -s\""        // 发布模式：去除符号表和调试信息

                        if (target.BuildArgs && target.BuildArgs.length > 0) {
                            for (let i = 0; i < target.BuildArgs.length; i++) {
                                cmd += " " + target.BuildArgs[i]
                            }
                        }
                        cmd += " -o " + exefile
                        let opt = XUtility.ExecOpt(targetpath)
                        opt.env["GOARCH"] = target.Arch
                        opt.env["GOOS"] = target.Os
                        XLog.Info("Build.Process({0}): {1}", target.ID, cmd)

                        try {
                            // 执行构建命令
                            child_process.exec(cmd, opt, async (error, stdout, stderr) => {
                                if (error) {
                                    postBuild(error)
                                } else {
                                    try {
                                        if (stdout) XLog.Info("Build.Process({0}).stdout: {1}", target.ID, stdout)
                                        if (stderr) XLog.Error("Build.Process({0}).stderr: {1}", target.ID, stderr)

                                        // 处理构建后的资源复制
                                        if (target.BuildCopy) {
                                            for (let i = 0; i < target.BuildCopy.length; i++) {
                                                let [src, dst] = target.BuildCopy[i].split(":")
                                                src = path.isAbsolute(src) ? XFile.NormalizePath(src) : XFile.NormalizePath(XFile.PathJoin(root, src))
                                                const gsync = new glob.GlobSync(src)
                                                if (gsync.found) {
                                                    if (XFile.HasFile(src)) { // 单文件复制
                                                        const f = gsync.found[0]
                                                        dst = dst ?
                                                            (path.isAbsolute(dst) ? XFile.NormalizePath(dst) : XFile.PathJoin(exepath, dst)) :
                                                            XFile.PathJoin(exepath, XFile.FileName(f))
                                                        XFile.CopyFile(f, dst)
                                                    } else { // 目录复制，保持结构
                                                        dst = dst ? (path.isAbsolute(dst) ? XFile.NormalizePath(dst) : XFile.PathJoin(exepath, dst)) : exepath
                                                        const base = XFile.NormalizePath(src.replace(/\*.*$/, ""))
                                                        for (let f of gsync.found) {
                                                            if (XFile.HasFile(f)) {
                                                                const rel = path.relative(base, f)
                                                                const to = XFile.PathJoin(dst, rel)
                                                                XFile.CopyFile(f, to)
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        postBuild()
                                    } catch (err) {
                                        postBuild(err)
                                    }
                                }
                            })
                        } catch (error) {
                            postBuild(error)
                        }
                    }

                    handleBuild()
                })
            })
        }
    }
}