//-------------------------------------------------//
//                    MIT License                  //
//    Copyright (c) 2025 EFramework Organization   //
//          SEE LICENSE.md FOR MORE DETAILS        //
//-------------------------------------------------//

import { XString } from "ep.uni.util"

/**
 * Target class defines the configuration structure for build and debug targets.
 * 
 * Target 类定义了构建和调试目标的配置结构.
 */
export class Target {
    protected name: string
    protected key: string
    protected arch: string
    protected os: string
    protected scriptPath: string
    protected buildArgs: string[]
    protected buildPath: string
    protected buildCopy: string[]
    protected startArgs: string[]
    protected startDelay: number
    protected stopDelay: number
    protected stopPort: string
    protected dlvFlags: string[]

    /**
     * Creates a new Target instance by merging base and raw configurations.
     * Supports inheritance through base target and overrides with raw target.
     * 
     * 通过合并基础配置和原始配置创建新的 Target 实例. 支持通过基础目标继承并使用原始目标进行覆盖.
     * 
     * @param name Target name identifier, 目标名称标识符.
     * @param key Target key for unique identification, 目标唯一标识键.
     * @param base Base target for inheritance, 用于继承的基础目标.
     * @param raw Raw target for overriding configurations, 用于覆盖配置的原始目标.
     */
    constructor(name: string, key: string, base: Target, raw: Target) {
        if (base) {
            for (let k in base) {
                this[k] = base[k]
            }
        }
        for (let k in raw) {
            this[k] = raw[k]
        }
        this.name = name
        this.key = key
    }

    /**
     * Gets the full identifier of the target in format "name.key".
     * 
     * 获取目标的完整标识符, 格式为 "name.key".
     * 
     * @returns Formatted target identifier, 格式化的目标标识符.
     */
    public get ID(): string { return XString.Format("{0}.{1}", this.name, this.key) }

    /**
     * Gets the target name.
     * 
     * 获取目标名称.
     * 
     * @returns Target name, 目标名称.
     */
    public get Name(): string { return this.name }

    /**
     * Gets the target architecture.
     * 
     * 获取目标架构.
     * 
     * @returns Target architecture, 目标架构.
     */
    public get Arch(): string { return this.arch }

    /**
     * Gets the target operating system.
     * 
     * 获取目标操作系统.
     * 
     * @returns Target operating system, 目标操作系统.
     */
    public get Os(): string { return this.os }

    /**
     * Gets the source path for the target.
     * 
     * 获取目标的源代码路径.
     * 
     * @returns Source path, 源代码路径.
     */
    public get ScriptPath(): string { return this.scriptPath }

    /**
     * Gets the build arguments array.
     * 
     * 获取构建参数数组.
     * 
     * @returns Build arguments array, 构建参数数组.
     */
    public get BuildArgs(): string[] { return this.buildArgs }

    /**
     * Gets the build output path.
     * 
     * 获取构建输出路径.
     * 
     * @returns Build output path, 构建输出路径.
     */
    public get BuildPath(): string { return this.buildPath }

    /**
     * Gets the array of files to copy after build.
     * 
     * 获取构建后需要复制的文件数组.
     * 
     * @returns Array of files to copy, 需要复制的文件数组.
     */
    public get BuildCopy(): string[] { return this.buildCopy }

    /**
     * Gets the startup arguments array.
     * 
     * 获取启动参数数组.
     * 
     * @returns Startup arguments array, 启动参数数组.
     */
    public get StartArgs(): string[] { return this.startArgs }

    /**
     * Gets the startup delay in seconds.
     * 
     * 获取启动延迟秒数.
     * 
     * @returns Startup delay in seconds, 启动延迟秒数.
     */
    public get StartDelay(): number { return this.startDelay }

    /**
     * Gets the stop delay in seconds.
     * 
     * 获取停止延迟秒数.
     * 
     * @returns Stop delay in seconds, 停止延迟秒数.
     */
    public get StopDelay(): number { return this.stopDelay }

    /**
     * Gets the stop port configuration.
     * 
     * 获取停止端口配置.
     * 
     * @returns Stop port configuration, 停止端口配置.
     */
    public get StopPort(): string { return this.stopPort }

    /**
     * Gets the Delve debugger flags array.
     * 
     * 获取 Delve 调试器标志数组.
     * 
     * @returns Delve debugger flags array, Delve 调试器标志数组.
     */
    public get DlvFlags(): string[] { return this.dlvFlags }
}