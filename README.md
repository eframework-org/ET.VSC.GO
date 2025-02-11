# ET.VSC.GO

[![Version](https://vsmarketplacebadges.dev/version-short/eframework-org.et-vsc-go.svg)](https://marketplace.visualstudio.com/items?itemName=eframework-org.et-vsc-go)
[![Installs](https://vsmarketplacebadges.dev/installs-short/eframework-org.et-vsc-go.svg)](vscode:extension/eframework-org.et-vsc-go)

VSC.GO 工具优化了 Gopher 们的开发流程，包括快速构建及调试等。

## 功能特性

- 📦 支持多项目配置
- 🚀 快速构建和调试

## 操作手册

### 功能清单

- 🔨 Build Project(s)：编译项目 [⌥⇧A]
- ▶️ Start Project(s)：运行项目 [⌥⇧S]
- ⏹️ Stop Project(s)：停止项目 [⌥⇧D]
- 🪲 Debug Project(s)：调试项目 [⌥⇧F]
- 🎮 Show Command(s)：控制面板 [⌥⇧P]

### 配置说明

| 字段 | 必要 | 说明 |
| --- | :---: | --- |
| arch | ✅ | 指令集架构：arm/arm64/amd64/386 等 |
| os | ✅ | 运行时平台：windows/linux/darwin 等 |
| scriptPath | ✅ | 源码路径 |
| buildPath | ✅ | 构建输出路径 |
| buildArgs | ➖ | 构建参数，参考：go help build |
| buildCopy | ➖ | 构建后复制的文件，支持 glob 和路径映射 |
| startArgs | ➖ | 启动参数 |
| startDelay | ➖ | 启动延迟（秒） |
| stopDelay | ➖ | 停止延迟（秒） |
| stopPort | ➖ | 端口文件路径 |
| dlvFlags | ➖ | 调试参数 |
| extends | ➖ | 拓展配置 |

### 配置示例

```json
{
    "et-vsc-go.projectList": {
        "Greet": {
            "base": {
                "arch": "amd64",
                "os": "windows",
                "scriptPath": "src/main",
                "buildPath": "bin",
                "buildCopy": [
                    "configs/*.json",
                    "assets/data:resources"
                ]
            },
            "debug.windows.amd64": {
                "extends": "base"
            },
            "release.windows.amd64": {
                "extends": "base",
                "buildArgs": ["-trimpath"]
            }
        }
    }
}
```

## 常见问题

如有问题，请提交 [问题反馈](CONTRIBUTING.md#问题反馈)。

## 项目信息

- [更新记录](CHANGELOG.md)
- [贡献指南](CONTRIBUTING.md)
- [许可证](LICENSE)
