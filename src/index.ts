//-------------------------------------------------//
//                    MIT License                  //
//    Copyright (c) 2025 EFramework Organization   //
//          SEE LICENSE.md FOR MORE DETAILS        //
//-------------------------------------------------//

import * as vscode from "vscode"
import { XEnv, XFile, XLog, XString } from "ep.uni.util"
import { Build } from "./Build"
import { Debug } from "./Debug"
import { Start } from "./Start"
import { Stop } from "./Stop"
import { Target } from "./Define"

const Commands = [
    {
        ID: `${XEnv.Identifier}.buildTarget`,
        Handler: async () => {
            const targets = await Selects("build", "release")
            await Build.Process(targets, false)
        }
    },
    {
        ID: `${XEnv.Identifier}.startTarget`,
        Handler: async () => {
            const targets = await Selects("start", "release", GoArch(), GoPlat())
            await Stop.Process(targets)
            await Start.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.stopTarget`,
        Handler: async () => {
            const targets = await Selects("stop", "debug", GoArch(), GoPlat())
            await Stop.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.debugTarget`,
        Handler: async () => {
            const targets = await Selects("debug", "debug", GoArch(), GoPlat())
            await Stop.Process(targets)
            await Build.Process(targets, true)
            await Debug.Process(targets)
        }
    },
    {
        ID: `${XEnv.Identifier}.showCommand`,
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

const mTargets = new Array<Target>()
var mSelector: vscode.QuickPick<vscode.QuickPickItem>

async function Selects(action: string, ...matchs: string[]): Promise<Target[]> {
    return new Promise<Target[]>((resolve, reject) => {
        try {
            const proj = vscode.workspace.rootPath
            const file = XFile.PathJoin(XEnv.DataPath, "selected.prefs")
            const labels = new Array<string>()
            mTargets.forEach(v => labels.push(v.ID))

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

            function onDidAccept() {
                if (mSelector.selectedItems) {
                    const targets = new Array<Target>()
                    for (let i = 0; i < mSelector.selectedItems.length; i++) {
                        const label = mSelector.selectedItems[i].label
                        for (let j = 0; j < mTargets.length; j++) {
                            const target = mTargets[j]
                            if (target.ID == label) {
                                targets.push(target)
                                break
                            }
                        }
                    }
                    saveLocal(mSelector.selectedItems)
                    mSelector.dispose()
                    mSelector = null
                    resolve(targets)
                }
            }

            if (mSelector) {
                onDidAccept()
            } else {
                mSelector = vscode.window.createQuickPick()
                mSelector.canSelectMany = true
                mSelector.placeholder = XString.Format("Select target(s) to {0}.", action)
                mSelector.items = filterTargets().map(label => ({ label }))
                mSelector.selectedItems = getLocalSelected(mSelector.items)
                mSelector.onDidAccept(onDidAccept)
                mSelector.onDidHide(() => {
                    mSelector.dispose()
                    mSelector = null
                })
                mSelector.show()
            }
        } catch (err) { reject(err) }
    })
}

function GoPlat(): string { return process.platform == "win32" ? "windows" : process.platform }

function GoArch(): string {
    // nodejs-arch:'arm'、'arm64'、'ia32'、'mips'、'mipsel'、'ppc'、'ppc64'、's390'、's390x'、'x64'
    let arch = process.arch as string
    if (process.arch == "x64") { arch = "amd64" }
    else if (process.arch == "ia32") { arch = "386" }
    return arch
}

export function activate(context: vscode.ExtensionContext) {
    function parseConfig() {
        mTargets.length = 0
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
                    if (mTargets.find(v => v.ID == scheme.ID) == null) {
                        mTargets.push(scheme)
                    }
                }
            }
        }
    }

    parseConfig()
    vscode.workspace.onDidChangeConfiguration(() => parseConfig())

    for (let i = 0; i < Commands.length; i++) {
        const meta = Commands[i]
        vscode.commands.registerCommand(meta.ID, meta.Handler)
    }

    const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
    context.subscriptions.push(bar)
    bar.tooltip = XEnv.Description
    if (Commands.length > 0) bar.command = Commands[Commands.length - 1].ID
    bar.text = XEnv.Product
    bar.show()

    XLog.Notice("Extension has been activated.")
}

export function deactivate() {
    if (mSelector) mSelector.dispose()
    XLog.Notice("Extension has been deactivated.")
}