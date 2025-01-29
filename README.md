# ET.VSC.GO
[![Version](https://img.shields.io/visual-studio-marketplace/v/eframework-org.et-vsc-go)](https://marketplace.visualstudio.com/items?itemName=eframework-org.et-vsc-go)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/eframework-org.et-vsc-go)](vscode:extension/eframework-org.et-vsc-go)  
VSC.GO 工具优化了Gopher们的开发流程，包括快速构建及调试等。

## 功能特性
- 多平台支持
  | Windows/WSL | Linux | OSX |
  | :-: | :-: | :-: |
  | ✅ | ✅ | ✅ |

- 快速构建及调试

## 操作手册
### 功能清单
- Build Target(s): 编译应用[Alt+Shift+A]
- Start Target(s): 运行应用[Alt+Shift+S]
- Stop Target(s): 停止应用[Alt+Shift+D]
- Debug Target(s): 调试应用[Alt+Shift+F]
- Show Command(s): 控制面板[Alt+Shift+P]

### 配置说明
```
"et-vsc-go.projectList": { // [必要] 工程列表。
    "type": "object",
    "default": {
        "$name": { // [必要] 工程名称。
            "base": { // [必要] 分组名称。
                "arch": "[arm/arm64/amd64/386/etc.]", // [必要] 目标架构。
                "os": "[windows/linux/darwin/etc.]", // [必要] 目标平台。
                "scriptPath": "$(path/to/script)", // [必要] 源码路径。
                "buildPath": "$(path/to/build)", // [必要] 构建路径。
                "buildArgs": [], // [可选] 构建参数，参考：go help build。
                "buildCopy": [ // [可选] 构建后拷贝路径。
                    "$(path/to/copy)",  // 简单复制，保持相对路径。
                    "$(copy/from/path):$(to/path)" // 指定源路径和目标路径。
                ],
                "startArgs": [], // [可选] 启动参数。
                "startDelay": 0.5, // [可选] 启动延迟（秒）。
                "stopDelay": 0.3, // [可选] 终止延迟（秒）。
                "stopPort": "$(./port/file)", // [可选] 终止端口文件。
                "dlvFlags": [ // [可选] 调试参数。
                    "--check-go-version=false"
                ]
            },
            "debug.windows.amd64": {
                "extends": "base" // [可选] 继承分组。
            },
            "release.windows.amd64": {
                "extends": "base", // [可选] 继承分组。
                "buildArgs": [ // [可选] 覆盖选项。
                    "-a",
                    "-trimpath"
                ]
            }
        }
    }
}
```

## 常见问题
