// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

/**
 * 插件入口模块，负责初始化、命令注册和生命周期管理。
 * @module index
 */

import * as vscode from "vscode"
import { XEnv, XFile, XLog, XString } from "ep.uni.util"
import { Build } from "./Build"
import { Debug } from "./Debug"
import { Start } from "./Start"
import { Stop } from "./Stop"
import { Target } from "./Define"

/** 插件支持的命令列表。 */
const Commands = [
    {
        ID: `${XEnv.Identifier}.buildTarget`,
        /** 处理构建目标的命令。 */
        Handler: async () => {
            const targets = await Selects("build", "release")
            await Build.Process(targets, false)
        }
    },
    {
        ID: `${XEnv.Identifier}.startTarget`,
        /** 处理启动目标的命令。 */
        Handler: async () => {
            const targets = await Selects("start", "release", GoArch(), GoPlat())
            await Stop.Process(targets)
            await Start.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.stopTarget`,
        /** 处理停止目标的命令。 */
        Handler: async () => {
            const targets = await Selects("stop", "debug", GoArch(), GoPlat())
            await Stop.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.debugTarget`,
        /** 处理调试目标的命令。 */
        Handler: async () => {
            const targets = await Selects("debug", "debug", GoArch(), GoPlat())
            await Stop.Process(targets)
            await Build.Process(targets, true)
            await Debug.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.showCommand`,
        /** 显示命令面板的命令。 */
        Handler: async () => {
            try {
                const pkg = vscode.extensions.getExtension(`${XEnv.Author}.${XEnv.Identifier}`).packageJSON
                let cmds: Array<{ title: string, command: string }> = pkg.contributes ? pkg.contributes.commands : null
                if (cmds && cmds.length > 1) {
                    cmds = cmds.slice(0, cmds.length - 1)
                    const ret = await vscode.window.showQuickPick(cmds.map((e) => e.title))
                    const cmd = cmds.find(e => e.title == ret)
                    if (cmd) vscode.commands.executeCommand(cmd.command)
                }
            } catch (err) {
                XLog.Panic(err)
            }
        }
    }
]

/** 已加载的目标配置列表。 */
const targets = new Array<Target>()

/** 目标选择器实例。 */
var selector: vscode.QuickPick<vscode.QuickPickItem>

/**
 * 选择目标配置。
 * @param action 当前操作名称。
 * @param matchs 匹配条件数组。
 * @returns 返回选中的目标配置数组。
 */
async function Selects(action: string, ...matchs: string[]): Promise<Target[]> {
    return new Promise<Target[]>((resolve, reject) => {
        try {
            const proj = vscode.workspace.rootPath
            const file = XFile.PathJoin(XEnv.DataPath, "selected.prefs")
            const labels = new Array<string>()
            targets.forEach(v => labels.push(v.ID))

            /**
             * 获取本地已选择的目标配置。
             * @param raws 原始目标配置列表。
             * @returns 返回已选择的目标配置列表。
             */
            function getLocalSelected(raws: readonly vscode.QuickPickItem[]): readonly vscode.QuickPickItem[] {
                if (XFile.HasFile(file)) {
                    let pick = XFile.OpenFile(file)
                    if (pick) {
                        let obj = JSON.parse(pick.toString())
                        if (obj) {
                            obj = obj[proj]
                            if (obj) {
                                obj = obj[action]
                                if (obj) {
                                    let nitems = new Array()
                                    for (let k in obj) {
                                        let v = obj[k]
                                        if (v.label) {
                                            for (let i = 0; i < raws.length; i++) {
                                                let v2 = raws[i]
                                                if (v2.label == v.label) {
                                                    nitems.push(v2)
                                                    break
                                                }
                                            }
                                        }
                                    }
                                    return nitems
                                }
                            }
                        }
                    }
                }
                return raws
            }

            /**
             * 保存本地选择的目标配置。
             * @param raws 需要保存的目标配置列表。
             */
            function saveLocal(raws: readonly vscode.QuickPickItem[]) {
                let allObjs = {}
                if (XFile.HasFile(file)) {
                    let pick = XFile.OpenFile(file)
                    if (pick) allObjs = JSON.parse(pick.toString())
                    if (allObjs == null) allObjs = {}
                }
                let projObj = allObjs[proj]
                if (projObj == null) projObj = {}; allObjs[proj] = projObj
                projObj[action] = raws
                let str = JSON.stringify(allObjs)
                XFile.SaveText(file, str)
            }

            /**
             * 根据匹配条件过滤目标配置。
             * @returns 返回符合条件的目标配置列表。
             */
            function filterTargets(): string[] {
                const targets = new Array<string>()
                for (let i = 0; i < labels.length; i++) {
                    let s = labels[i]
                    let matched = true
                    if (matchs && matchs.length > 0) {
                        let strs = s.split(".")
                        for (let j = 0; j < matchs.length; j++) {
                            let sig = false
                            for (let k = 0; k < strs.length; k++) {
                                if (strs[k] == matchs[j]) {
                                    sig = true
                                    break
                                }
                            }
                            if (sig == false) {
                                matched = false
                                break
                            }
                        }
                    }
                    if (matched) targets.push(s)
                }
                return targets
            }

            /**
             * 处理目标选择确认事件。
             */
            function onDidAccept() {
                if (selector.selectedItems) {
                    const selected = new Array<Target>()
                    for (let i = 0; i < selector.selectedItems.length; i++) {
                        const label = selector.selectedItems[i].label
                        for (let j = 0; j < targets.length; j++) {
                            const target = targets[j]
                            if (target.ID == label) {
                                selected.push(target)
                                break
                            }
                        }
                    }
                    saveLocal(selector.selectedItems)
                    selector.dispose()
                    selector = null
                    resolve(selected)
                }
            }

            if (selector) {
                onDidAccept()
            } else {
                selector = vscode.window.createQuickPick()
                selector.canSelectMany = true
                selector.placeholder = XString.Format("Select target(s) to {0}.", action)
                selector.items = filterTargets().map(label => ({ label }))
                selector.selectedItems = getLocalSelected(selector.items)
                selector.onDidAccept(onDidAccept)
                selector.onDidHide(() => {
                    selector.dispose()
                    selector = null
                })
                selector.show()
            }
        } catch (err) { reject(err) }
    })
}

/**
 * 获取当前 Go 环境的目标架构。
 * @returns 返回目标架构字符串。
 */
function GoArch(): string {
    // nodejs-arch:'arm'、'arm64'、'ia32'、'mips'、'mipsel'、'ppc'、'ppc64'、's390'、's390x'、'x64'
    let arch = process.arch as string
    if (process.arch == "x64") { arch = "amd64" }
    else if (process.arch == "ia32") { arch = "386" }
    return arch
}

/**
 * 获取当前 Go 环境的目标平台。
 * @returns 返回目标平台字符串。
 */
function GoPlat(): string { return process.platform == "win32" ? "windows" : process.platform }

/**
 * 插件激活入口函数。
 * @param context 插件上下文。
 */
export function activate(context: vscode.ExtensionContext) {
    /**
     * 解析并加载配置。
     */
    function parseConfig() {
        targets.length = 0
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(XEnv.Identifier)
        const projectList: any = config.get("projectList")
        if (projectList) {
            for (const name in projectList) {
                if (name == "$name") continue
                const otarget = projectList[name]
                const temp = new Map<string, Target>()
                for (const key in otarget) {
                    const raw: Target = otarget[key]
                    const base = temp.get(raw["extends"])
                    const scheme = new Target(name, key, base, raw)
                    temp.set(key, scheme)
                    if (targets.find(v => v.ID == scheme.ID) == null) {
                        targets.push(scheme)
                    }
                }
            }
        }
    }

    // 初始化配置
    parseConfig()

    // 监听配置变化
    vscode.workspace.onDidChangeConfiguration(() => parseConfig())

    // 注册命令
    for (let i = 0; i < Commands.length; i++) {
        const meta = Commands[i]
        vscode.commands.registerCommand(meta.ID, meta.Handler)
    }

    // 创建状态栏项
    const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
    context.subscriptions.push(bar)
    bar.tooltip = XEnv.Description
    if (Commands.length > 0) bar.command = Commands[Commands.length - 1].ID
    bar.text = XEnv.Product
    bar.show()

    XLog.Notice("Extension has been activated.")
}

/**
 * 插件停用函数。
 */
export function deactivate() {
    if (selector) selector.dispose()
    XLog.Notice("Extension has been deactivated.")
}