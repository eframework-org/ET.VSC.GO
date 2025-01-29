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
 * Build namespace handles all build-related operations, including compilation, resource copying, and build status tracking.
 * 
 * Build 命名空间处理所有构建相关的操作, 包括编译、资源复制和构建状态跟踪.
 */
export namespace Build {
    /**
     * Process executes build tasks for multiple targets with progress tracking and error handling.
     * The function supports both debug and release builds, manages build dependencies, and handles resource copying.
     * 
     * 处理多个目标的构建任务, 包含进度跟踪和错误处理. 该函数支持调试和发布构建, 管理构建依赖, 并处理资源复制.
     * 
     * @param targets Array of Target objects containing build configurations, 目标数组包含构建配置信息.
     * @param debug Flag to indicate debug build mode, 标志位指示是否为调试构建模式.
     * @returns Promise that resolves when all builds complete, Promise在所有构建完成时解析.
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

                    let done = 0
                    let succeed = 0
                    let failed: Array<string> = new Array()
                    let index = 0
                    let target: Target
                    const incre = 1 / targets.length * 100

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
                        if (done >= targets.length || canceled) {
                            let str = ""
                            if (failed.length == 0) {
                                str = XString.Format("Build {0} target(s) succeed.", done)
                                vscode.window.showInformationMessage(str)
                            } else {
                                str = XString.Format("Build {0} target(s) succeed, failed({1}): {2}.", succeed, failed.length, failed.join(", "))
                                vscode.window.showErrorMessage(str)
                            }
                            setTimeout(resolve, 800) // 等待进度条显示100%
                        } else {
                            index++
                            handleBuild()
                        }
                    }

                    function handleBuild() {
                        target = targets[index]
                        progress.report({ increment: incre * 0.2, message: XString.Format("{0} ({1} of {2})", target.ID, done + 1, targets.length) })

                        const envstr = debug ? "debug" : "release"
                        const root = vscode.workspace.rootPath
                        const osarch = XString.Format("{0}_{1}", target.Os, target.Arch)
                        const exename = target.Os == "windows" ? target.Name + ".exe" : target.Name
                        const targetpath = XFile.NormalizePath(path.isAbsolute(target.ScriptPath) ? target.ScriptPath : XFile.PathJoin(root, target.ScriptPath))
                        const exepath = path.isAbsolute(target.BuildPath) ?
                            XFile.PathJoin(target.BuildPath, osarch, envstr, target.Name) :
                            XFile.PathJoin(root, target.BuildPath, osarch, envstr, target.Name)
                        const exefile = XFile.PathJoin(exepath, exename)

                        let cmd = debug ?
                            "go build -gcflags=\"all=-N -l\"" :
                            "go build -ldflags=\"-w -s\""

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
                            child_process.exec(cmd, opt, async (error, stdout, stderr) => {
                                if (error) {
                                    postBuild(error)
                                } else {
                                    try {
                                        if (stdout) XLog.Info("Build.Process({0}).stdout: {1}", target.ID, stdout)
                                        if (stderr) XLog.Error("Build.Process({0}).stderr: {1}", target.ID, stderr)
                                        if (target.BuildCopy) {
                                            for (let i = 0; i < target.BuildCopy.length; i++) {
                                                let [src, dst] = target.BuildCopy[i].split(":")
                                                src = path.isAbsolute(src) ? XFile.NormalizePath(src) : XFile.NormalizePath(XFile.PathJoin(root, src))
                                                const gsync = new glob.GlobSync(src)
                                                if (gsync.found) {
                                                    if (XFile.HasFile(src)) { // 单文件
                                                        const f = gsync.found[0]
                                                        dst = dst ?
                                                            (path.isAbsolute(dst) ? XFile.NormalizePath(dst) : XFile.PathJoin(exepath, dst)) :
                                                            XFile.PathJoin(exepath, XFile.FileName(f))
                                                        XFile.CopyFile(f, dst)
                                                    } else {
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