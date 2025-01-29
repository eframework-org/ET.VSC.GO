# ET.VSC.GO
[![Version](https://img.shields.io/visual-studio-marketplace/v/eframework-org.et-vsc-go)](https://marketplace.visualstudio.com/items?itemName=eframework-org.et-vsc-go)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/eframework-org.et-vsc-go)](vscode:extension/eframework-org.et-vsc-go)  
VSC.GO 工具优化了 Gopher 们的开发流程，包括快速构建及调试等。

## 功能特性
- 快速构建和调试
- 支持多目标配置
- 支持资源文件复制
- 多平台支持
  | Windows/WSL | Linux | OSX |
  | :-: | :-: | :-: |
  | ✅ | ✅ | ✅ |

## 操作手册
### 功能清单
- Build Target(s): 编译应用[Alt+Shift+A]
- Start Target(s): 运行应用[Alt+Shift+S]
- Stop Target(s): 停止应用[Alt+Shift+D]
- Debug Target(s): 调试应用[Alt+Shift+F]
- Show Command(s): 控制面板[Alt+Shift+P]

### 配置说明
| 字段 | 必要 | 说明 |
| --- | :---: | --- |
| extends | ➖ | 继承分组 |
| arch | ✅ | 目标架构：arm/arm64/amd64/386 等 |
| os | ✅ | 目标平台：windows/linux/darwin 等 |
| scriptPath | ✅ | 源码路径 |
| buildPath | ✅ | 构建输出路径 |
| buildArgs | ➖ | 构建参数，参考：go help build |
| buildCopy | ➖ | 构建后复制的文件，支持 glob 和路径映射 |
| startArgs | ➖ | 启动参数 |
| startDelay | ➖ | 启动延迟（秒） |
| stopDelay | ➖ | 停止延迟（秒） |
| stopPort | ➖ | 端口文件路径 |
| dlvFlags | ➖ | 调试参数 |

### 配置示例
```json
{
    "et-vsc-go.projectList": {
        "greet": {
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
如有问题，请参考 [问题反馈](CONTRIBUTING.md#问题反馈)。

## 更新记录
请参考 [更新记录](CHANGELOG.md)。

## 贡献指南
请参考 [贡献指南](CONTRIBUTING.md)。

## 许可证
请参考 [许可证](LICENSE)。
