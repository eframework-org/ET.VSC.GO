# 贡献指南

感谢您考虑为本项目做出贡献！

## 技术路线

### 1. 开发语言
- TypeScript 4.1.6：主要开发语言
- Node.js 16.11.7：运行环境
- Go 1.18+：目标语言支持

### 2. 核心依赖
- vscode 1.50.0：VSCode 扩展 API
- webpack 5.84.1：代码打包
- ep.uni.util 0.0.2：工具库
  - XFile：文件操作
  - XLog：日志记录
  - XString：字符串处理
  - XTest：测试框架
- glob 7.2.3：文件匹配
- child_process：进程管理
- path：路径处理

### 3. 调试工具
- @vscode/debugadapter 1.50.0：调试适配器
- @vscode/debugprotocol 1.50.0：调试协议
- kill-port 1.6.1：端口管理
- go-delve：Go 语言调试器

### 4. 构建工具
- ts-loader 5.3.3：TypeScript 加载器
- @vscode/vsce 3.2.1：VSCode 扩展打包
- webpack-cli 5.1.1：Webpack 命令行

### 5. 开发流程
- 本地开发 -> 单元测试 -> 集成测试 -> 发布商店
- 遵循 TypeScript 严格模式
- 使用 Webpack 优化打包体积
- 支持 source map 便于调试

### 6. 版本控制
- 使用 Git 进行版本控制
- 遵循语义化版本规范
- 使用 GitHub Actions 自动发布

### 7. 质量控制 
- 单元测试覆盖核心功能
- 代码审查确保质量
- 自动化构建和发布

## 目录规范

### 1. 源码目录
- src/：源码目录
  - Build.ts：构建相关操作
  - Debug.ts：调试相关操作
  - Define.ts：类型定义
  - index.ts：插件入口
  - Start.ts：启动相关操作
  - Stop.ts：停止相关操作
  - *.Test.ts：测试文件

### 2. 构建目录
- dist/：构建输出目录
  - index.js：打包后的插件代码
  - *.js.map：源码映射文件

### 3. 资源目录
- res/：资源文件目录
  - logo.png：插件图标

### 4. 配置目录
- .vscode/：VSCode 配置
  - launch.json：调试配置
  - tasks.json：任务配置
- .github/：GitHub 配置
  - workflows/：工作流配置
  - ISSUE_TEMPLATE/：问题模板

### 5. 文档目录
- docs/：文档目录（可选）
  - images/：文档图片
  - api/：API 文档

### 6. 根目录文件
- package.json：项目配置
- tsconfig.json：TypeScript 配置
- webpack.config.js：打包配置
- README.md：项目说明
- CONTRIBUTING.md：贡献指南
- CHANGELOG.md：更新记录
- LICENSE：许可证声明
- .gitignore：Git 忽略配置

### 7. 自动生成目录
- node_modules/：依赖目录
- *.vsix：打包文件 

## 文档规范

### 1. 语言规范
- 首选语言：中文
- 专有名词保持原文，如：Node.js、TypeScript
- 中英文之间需要空格，如：Hello 你好

### 2. 标点规范
- 中文文档使用中文标点
- 代码、命令示例使用英文标点

### 3. 格式规范
- 使用 Markdown 编写文档
- 标题使用 ATX 风格（#）
- 列表使用短横线（-）作为标记
- 代码块使用三个反引号（```）
- 文件末尾保留一个空行

### 4. 文档类型
- README.md：项目说明
- CONTRIBUTING.md：贡献指南
- CHANGELOG.md：更新记录
- LICENSE：许可证声明

### 5. 链接规范
- 使用相对路径链接项目内文件
- 使用完整 URL 链接外部资源
- 锚点使用小写，空格替换为连字符

## 代码规范

### 1. 代码风格
- 使用 TypeScript 语言编写
- 使用 4 空格缩进代码
- 使用双引号作为字符串引号
- 使用 ASI（自动分号插入）规则
- 版权声明、类、函数之间及文件末尾保留一个空行

### 2. 命名规范
- 类名：使用 PascalCase
- 函数名：使用 PascalCase
- 变量名：使用 camelCase
- 常量名：使用 PascalCase
- 文件名：使用 PascalCase

### 3. 注释规范
- 基于 [JSDoc](https://jsdoc.app/) 标准
- 所有公开 API 必须包含注释
- 复杂逻辑需要添加详细注释说明
- 遵循 [语言规范](#1-语言规范) 和 [标点规范](#2-标点规范)
- 代码源文件抬头必须包含版权声明
```
// Copyright (c) 2025 EFramework Organization. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.
```

## 提交规范

### 1. 分支命名
- 功能分支：`feature/功能名称`
- 修复分支：`fix/问题描述`
- 优化分支：`optimize/优化内容`

### 2. 提交信息
- 遵循 [语言规范](#1-语言规范) 和 [标点规范](#2-标点规范)
```
<类型>: <描述>

[可选的详细描述]

[可选的关闭问题]
```

- 类型包括：
  - `feat`: 新功能
  - `fix`: 修复问题
  - `docs`: 文档更新
  - `style`: 代码格式调整
  - `refactor`: 代码重构
  - `perf`: 性能优化
  - `test`: 测试相关
  - `chore`: 构建过程或辅助工具的变动

### 3. 提交示例
```
feat: 添加XX功能
- 添加了XX特性A
- 优化了XX流程B
- 更新相关文档
  
详细说明此功能的主要变更和影响范围
  
Closes #123
```

## 测试规范

### 1. 测试覆盖
- 新功能必须包含对应的测试用例
- 修复问题时需要添加相关的测试用例
- 重构代码时确保现有测试用例通过

### 2. 测试用例编写
- 测试文件命名：`*.Test.ts`
- 使用 [EP.UNI.UTIL/XTest](https://github.com/eframework-org/EP.UNI.UTIL) 测试框架

## 开发流程

### 1. 克隆仓库
```bash
git clone https://github.com/eframework-org/ET.VSC.GO.git
cd ET.VSC.GO
```

### 2. 安装依赖
```bash
npm install
```

### 3. 开发调试
- 确保已安装 Go 1.18+ 和 Delve 并配置 VSCode Go 扩展
- 在 VSCode 中打开项目
- 按 F5 启动调试
- 在新窗口中测试插件

### 4. 构建安装
```bash
npm run release
code --install-extension *.vsix
```

## 发布流程

### 1. 版本号规范
- 遵循 [语义化版本](https://semver.org/lang/zh-CN/) 2.0.0
- 格式：`主版本号.次版本号.修订号`
- 示例：`1.0.0`、`1.2.3`

### 2. 更新记录规范
- 使用年月日格式：`YYYY-MM-DD`
- 按版本号降序排列
- 分类记录变更内容：
  ```markdown
  ## [1.0.0] - 2024-03-21
  ### 新增
  - 添加了新功能 A
  - 添加了新功能 B
  
  ### 优化
  - 优化了功能 C 的性能
  - 改进了功能 D 的用户体验
  
  ### 修复
  - 修复了问题 E
  - 修复了问题 F
  
  ### 变更
  - 调整了配置项 G
  - 更新了依赖库版本
  ```

### 3. 发布步骤
- 更新版本号：`npm version patch/minor/major`
- 构建发布包：`npm run release`
- 发布到商店：Run workflow [Publish](https://github.com/eframework-org/ET.VSC.GO/actions/workflows/publish.yml)

## 相关链接

- [插件管理](https://marketplace.visualstudio.com/manage/)
- [打包说明](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)
- [示例代码](https://github.com/microsoft/vscode-extension-samples)

## 问题反馈

### 1. 提交问题前：
- 搜索现有 [issues](https://github.com/eframework-org/ET.VSC.GO/issues) 避免重复
- 确认问题可以稳定重现
- 收集必要的环境信息

### 2. 问题报告格式：
```markdown
### 问题描述
[清晰简洁的问题描述]

### 重现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

### 期望行为
[描述期望的结果]

### 实际行为
[描述实际的结果]

### 环境信息
- VSCode 版本：如 1.80.2
- 操作系统：如 Windows 11
- 插件版本：如 0.0.1
```

## 许可证

通过提交代码，您同意将您的代码贡献置于 [MIT 许可证](LICENSE) 之下。
