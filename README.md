# ET.VSC.GO
[![Version](https://img.shields.io/visual-studio-marketplace/v/eframework-org.et-vsc-go)](https://marketplace.visualstudio.com/items?itemName=eframework-org.et-vsc-go)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/eframework-org.et-vsc-go)](vscode:extension/eframework-org.et-vsc-go)  
Tool VSC.GO optimized gopher's development workflow, including building, debugging, etc.  
VSC.GO 工具优化了Gopher们的开发流程，包括快速构建及调试等。

## Features | 功能特性
- 多平台支持
  | Windows/WSL | Linux | OSX |
  | :-: | :-: | :-: |
  | ✅ | ✅ | ✅ |

- 快速构建及调试

## Manual | 操作手册
### Functions | 功能清单
- Build Target(s): 编译应用[Alt+Shift+A]
- Start Target(s): 运行应用[Alt+Shift+S]
- Stop Target(s): 停止应用[Alt+Shift+D]
- Debug Target(s): 调试应用[Alt+Shift+F]
- Show Command(s): 控制面板[Alt+Shift+P]

### Configuration | 配置说明
```
"et-vsc-go.projectList": { // [required/必要] Project list. 工程列表。
    "type": "object",
    "default": {
        "$name": { // [required/必要] Project name. 工程名称。
            "base": { // [required/必要] Group name. 分组名称。
                "arch": "[arm/arm64/amd64/386/etc.]", // [required/必要] Target arch. 目标架构。
                "os": "[windows/linux/darwin/etc.]", // [required/必要] Target platorm. 目标平台。
                "scriptPath": "$(path/to/script)", // [required/必要] Script path. 源码路径。
                "buildArgs": [], // [optional/可选][see go help build] Build argument. 构建参数。
                "buildPath": "$(path/to/build)", // [optional/可选] [default: bin/] Build path. 构建路径。
                "buildCopy": [ // [optional/可选] Copy path(relative) after build. 构建后拷贝路径(相对)。
                    "$(rel/path/to/copy)"
                ],
                "startArgs": [], // [optional/可选] Start argument. 启动参数。
                "startDelay": 0.5, // [optional/可选] Start delay time(seconds). 启动延迟(秒)。
                "stopDelay": 0.3, [optional/可选] Stop delay time(seconds). 终止延迟(秒)。
                "stopPort": "$(./log/port)", // [optional/可选] Stop port file. 终止端口文件。
                "dlvFlags": [ // [optional/可选] Debug argument. 调试参数。
                    "--check-go-version=false"
                ]
            },
            "debug.windows.amd64": {
                "extends": "base" // [optional/可选] Inherited group. 继承分组。
            },
            "release.windows.amd64": {
                "extends": "base", // [optional/可选] Inherited group. 继承分组。
                "buildArgs": [ // [optional/可选] Overridden option. 覆盖选项。
                    "-a",
                    "-trimpath"
                ]
            }
        }
    }
}
```

## FAQ | 常见问题

## Changelog | 版本记录
### 0.0.1
- Initial commit. 首次提交。

## Developer | 开发者
- npm run debug
- npm run release
- npm run publish
- npm run unpublish
- code --install-extension et-vsc-go-0.0.1.vsix
- https://marketplace.visualstudio.com/manage/
- https://code.visualstudio.com/api/working-with-extensions/bundling-extension
- https://github.com/microsoft/vscode-extension-samples
