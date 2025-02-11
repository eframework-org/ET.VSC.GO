// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { XString } from "ep.uni.util"

/**
 * Project 类定义了构建和调试项目的配置结构。
 * 用于管理项目的所有配置属性，支持配置继承。
 */
export class Project {
    /** 项目名称。 */
    protected name: string

    /** 项目键名。 */
    protected key: string

    /** 项目架构。 */
    protected arch: string

    /** 项目平台。 */
    protected os: string

    /** 源码路径。 */
    protected scriptPath: string

    /** 构建参数数组。 */
    protected buildArgs: string[]

    /** 构建输出路径。 */
    protected buildPath: string

    /** 构建后需要复制的文件配置数组。 */
    protected buildCopy: string[]

    /** 启动参数数组。 */
    protected startArgs: string[]

    /** 启动延迟时间（秒）。 */
    protected startDelay: number

    /** 停止延迟时间（秒）。 */
    protected stopDelay: number

    /** 停止端口配置文件路径。 */
    protected stopPort: string

    /** 调试器参数数组。 */
    protected dlvFlags: string[]

    /**
     * 创建项目配置实例。
     * @param name 项目名称。
     * @param key 配置键名。
     * @param base 基础配置（用于继承）。
     * @param raw 原始配置数据。
     */
    constructor(name: string, key: string, base: Project, raw: Project) {
        // 继承基础配置
        if (base) {
            for (let k in base) {
                this[k] = base[k]
            }
        }
        // 应用原始配置
        for (let k in raw) {
            this[k] = raw[k]
        }
        this.name = name
        this.key = key
    }

    /** 获取项目的完整标识符，格式为 "name.key"。 */
    public get ID(): string { return XString.Format("{0}.{1}", this.name, this.key) }

    /** 获取项目名称。 */
    public get Name(): string { return this.name }

    /** 获取项目架构。 */
    public get Arch(): string { return this.arch }

    /** 获取项目平台。 */
    public get Os(): string { return this.os }

    /** 获取源码路径。 */
    public get ScriptPath(): string { return this.scriptPath }

    /** 获取构建参数数组。 */
    public get BuildArgs(): string[] { return this.buildArgs }

    /** 获取构建输出路径。 */
    public get BuildPath(): string { return this.buildPath }

    /** 获取构建后需要复制的文件配置数组。 */
    public get BuildCopy(): string[] { return this.buildCopy }

    /** 获取启动参数数组。 */
    public get StartArgs(): string[] { return this.startArgs }

    /** 获取启动延迟时间（秒）。 */
    public get StartDelay(): number { return this.startDelay }

    /** 获取停止延迟时间（秒）。 */
    public get StopDelay(): number { return this.stopDelay }

    /** 获取停止端口配置文件路径。 */
    public get StopPort(): string { return this.stopPort }

    /** 获取调试器参数数组。 */
    public get DlvFlags(): string[] { return this.dlvFlags }
}