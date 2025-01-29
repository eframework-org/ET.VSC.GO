# 贡献指南
感谢您考虑为 ET.VSC.GO 项目做出贡献！

## 开发环境
1. 克隆仓库
```bash
git clone https://github.com/eframework-org/ET.VSC.GO.git
cd ET.VSC.GO
```

2. 安装依赖
```bash
npm install
```

3. 开发调试
```bash
Run and Debug -> Extension
```

## 代码规范
1. 代码风格
- 使用 TypeScript 编写
- 使用 4 空格缩进
- **无需**使用分号结束语句
- 使用双引号作为字符串引号
- 函数、方法、类之间及文件末尾保留一个空行

2. 命名规范
- 类名：使用 PascalCase
- 函数名：使用 PascalCase
- 变量名：使用 camelCase
- 常量名：使用 UPPER_CASE
- 文件名：使用 PascalCase

3. 注释规范
- 使用 **JSDoc** 标准编写中文注释
- 所有公开 API 必须包含注释
- 复杂逻辑需要添加详细注释说明

## 提交规范
1. 分支命名
- 功能分支：`feature/功能名称`
- 修复分支：`fix/问题描述`
- 优化分支：`optimize/优化内容`

2. 提交信息格式
```
<类型>: <描述>

[可选的详细描述]

[可选的关闭问题]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

3. 示例
```
feat: 添加文件复制目标路径支持

- 支持 src:dst 格式的复制路径配置
- 保持原有简单路径复制功能
- 更新相关文档

Closes #123
```

## 测试规范
1. 测试覆盖
- 新功能必须包含对应的测试用例
- 修复问题时需要添加相关的测试用例
- 重构代码时确保现有测试用例通过

2. 测试用例编写
- 测试文件命名：`*.Test.ts`
- 使用 XTest 测试框架

## 发布流程
1. 版本号规范
- 遵循 Semantic Versioning 2.0.0
- 格式：`主版本号.次版本号.修订号`

2. 更新记录规范
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

3. 发布步骤
- 更新版本号：npm version patch/minor/major
- 构建发布包：npm run release
- 发布到商店：Run workflow [Publish](https://github.com/eframework-org/ET.VSC.GO/actions/workflows/publish.yml)

## 问题反馈
1. 提交问题前：
- 搜索现有 issues 避免重复
- 确认问题可以稳定重现
- 收集必要的环境信息

2. 问题报告格式：
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
- VSCode 版本：
- 操作系统：
- 插件版本：
```

## 相关链接
- [插件管理](https://marketplace.visualstudio.com/manage/)
- [打包说明](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)
- [示例代码](https://github.com/microsoft/vscode-extension-samples)

## 许可证
通过提交代码，您同意将您的代码贡献置于 [MIT 许可证](LICENSE.md)之下。 
