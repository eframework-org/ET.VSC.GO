// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as vscode from "vscode"
import * as path from "path"
import * as child_process from "child_process"
import * as glob from "glob"
import { XFile, XLog, XString, XUtility } from "ep.uni.util"
import { Project } from "./Define"

/**
 * Build 命名空间处理所有构建相关的操作。
 * 提供项目的编译、资源复制等功能。
 * @namespace
 */
export namespace Build {
    /**
     * 处理多个项目的构建任务。
     * @param projects 项目配置数组。
     * @param debug 是否为调试构建。
     * @returns Promise 在所有构建完成时解析。
     */
    export async function Process(projects: Project[], debug: boolean): Promise<void> {
        if (projects == null || projects.length == 0) {
            XLog.Warn("Build.Process: no project(s) was selected.")
            vscode.window.showInformationMessage("No project(s) was selected.")
        } else {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Building project(s)",
                cancellable: true
            }, (progress, token) => {
                return new Promise<void>(async (resolve, reject) => {
                    let canceled = false
                    token.onCancellationRequested(() => {
                        canceled = true
                        XLog.Info("Building project(s) has been canceled.")
                        reject("Building project(s) has been canceled.")
                    })

                    let done = 0            // 已完成数量
                    let succeed = 0         // 成功数量
                    let failed: string[] = []   // 失败的项目标识
                    let index = 0           // 当前处理的索引
                    let project: Project      // 当前处理的项目
                    const incre = 1 / projects.length * 100  // 每个项目的进度增量

                    /**
                     * 处理构建完成后的状态更新。
                     * @param err 构建过程中的错误（如果有）。
                     */
                    function postBuild(err?: Error) {
                        done++
                        progress.report({ increment: incre * 0.8, message: XString.Format("{0} ({1} of {2})", project.ID, done, projects.length) })

                        if (err) {
                            failed.push(project.ID)
                            XLog.Error("Build.Process({0}): build failed: {1}", project.ID, err)
                        } else {
                            succeed++
                            XLog.Info("Build.Process({0}): build succeed.", project.ID)
                        }

                        // 检查是否所有项目都已处理完成
                        if (done >= projects.length || canceled) {
                            let str = ""
                            if (failed.length == 0) {
                                str = XString.Format("Build {0} project(s) succeed.", done)
                                vscode.window.showInformationMessage(str)
                            } else {
                                str = XString.Format("Build {0} project(s) succeed, failed({1}): {2}.", succeed, failed.length, failed.join(", "))
                                vscode.window.showErrorMessage(str)
                            }
                            setTimeout(resolve, 800) // 等待进度条显示完成
                        } else {
                            index++
                            handleBuild()
                        }
                    }

                    /**
                     * 处理单个项目的构建过程。
                     * 包括环境准备、执行构建和资源复制。
                     */
                    function handleBuild() {
                        project = projects[index]
                        progress.report({ increment: incre * 0.2, message: XString.Format("{0} ({1} of {2})", project.ID, done + 1, projects.length) })

                        // 准备构建环境和路径
                        const envstr = debug ? "debug" : "release"
                        const root = vscode.workspace.rootPath
                        const osarch = XString.Format("{0}_{1}", project.Os, project.Arch)
                        const exename = project.Os == "windows" ? project.Name + ".exe" : project.Name
                        const projpath = XFile.NormalizePath(path.isAbsolute(project.ScriptPath) ? project.ScriptPath : XFile.PathJoin(root, project.ScriptPath))
                        const exepath = path.isAbsolute(project.BuildPath) ?
                            XFile.PathJoin(project.BuildPath, osarch, envstr, project.Name) :
                            XFile.PathJoin(root, project.BuildPath, osarch, envstr, project.Name)
                        const exefile = XFile.PathJoin(exepath, exename)

                        // 构建命令准备
                        let cmd = debug ?
                            "go build -gcflags=\"all=-N -l\"" :  // 调试模式：保留符号表
                            "go build -ldflags=\"-w -s\""        // 发布模式：去除符号表和调试信息

                        if (project.BuildArgs && project.BuildArgs.length > 0) {
                            for (let i = 0; i < project.BuildArgs.length; i++) {
                                cmd += " " + project.BuildArgs[i]
                            }
                        }
                        cmd += " -o " + exefile
                        let opt = XUtility.ExecOpt(projpath)
                        opt.env["GOARCH"] = project.Arch
                        opt.env["GOOS"] = project.Os
                        XLog.Info("Build.Process({0}): {1}", project.ID, cmd)

                        try {
                            // 执行构建命令
                            child_process.exec(cmd, opt, async (error, stdout, stderr) => {
                                if (error) {
                                    postBuild(error)
                                } else {
                                    try {
                                        if (stdout) XLog.Info("Build.Process({0}).stdout: {1}", project.ID, stdout)
                                        if (stderr) XLog.Error("Build.Process({0}).stderr: {1}", project.ID, stderr)

                                        // 处理构建后的资源复制
                                        if (project.BuildCopy) {
                                            for (let i = 0; i < project.BuildCopy.length; i++) {
                                                let [src, dst] = project.BuildCopy[i].split(":")
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