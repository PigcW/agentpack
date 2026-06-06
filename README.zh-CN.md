# AgentPack Doctor 中文使用清单

AgentPack Doctor 是一个本地 CLI 工具，用来在你把项目交给 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw、Harness 等 AI Coding Agent 之前，先检查项目是不是适合交接。

它不是代码质量扫描器，也不是漏洞扫描器。它现在更像一个「AI 接手项目前的体检工具」：先把容易让 Agent 卡住、乱读、误判、浪费上下文的问题提前暴露出来。

## 一句话定位

在让 AI Coding Agent 开始干活之前，先跑一遍：

```bash
npx @pigcw/agentpack doctor
```

如果报告里有 critical 问题，先处理再交给 Agent。

## 安装和运行

临时运行，不安装到项目：

```bash
npx @pigcw/agentpack doctor
```

安装到当前项目：

```bash
npm install -D @pigcw/agentpack
npx agentpack doctor
```

要求：

- Node.js 20 或更高版本

## 当前已有命令

| 命令 | 用途 |
| --- | --- |
| `agentpack doctor` | 执行完整项目体检。 |
| `agentpack doctor --json` | 只输出 JSON，方便给 CI、脚本或其他 Agent 读取。 |
| `agentpack doctor --ci` | 使用 CI 友好的退出码，有 critical 问题时返回 `1`。 |
| `agentpack doctor --only security` | 只检查安全边界。 |
| `agentpack doctor --only mcp` | 只检查 MCP 配置。 |
| `agentpack fix --dry-run` | 预览修复建议，但不写入文件。 |

注意：v0.1 版本还不会真正自动修改文件。`fix` 必须带 `--dry-run`，否则会返回错误。

## 适合什么时候用

你可以在这些场景里使用它：

- 准备让 Codex / Claude Code / Cursor 接手一个项目之前
- 刚从 GitHub 拉下一个陌生项目，想快速知道 Agent 能不能读懂入口
- 项目里同时配置了多个 MCP，想看有没有冲突或坏配置
- 项目里可能有 `.env`、密钥、私密目录，想确认 Git 和 Agent 规则有没有挡住
- 准备把项目交给另一个 Agent 或另一个工作空间之前
- 想在 CI 里加一道「AI 交接准备度」检查

## 它现在会检查什么

### 1. Agent 上下文

检查项目有没有给 AI Agent 一个清晰入口。

它会看：

- 是否存在 `AGENTS.md`
- 是否存在 `CLAUDE.md`
- 是否存在 `.cursorrules`
- 是否存在 `.cursor/rules`
- 是否存在 `README.md`
- Agent 入口文件里有没有运行或启动命令
- Agent 入口文件里有没有测试命令
- Agent 入口文件里有没有禁止读取或边界规则
- Agent 入口文件里有没有「先读哪里」的说明

典型问题：

- 没有 `AGENTS.md`
- 有代码但没有告诉 Agent 怎么运行
- 有测试但没有告诉 Agent 怎么测
- 有敏感文件但没有告诉 Agent 不要读

### 2. MCP 健康度

检查常见 MCP 配置问题。

当前会读取：

- `.mcp.json`
- `.cursor/mcp.json`
- `.codex/config.toml`

它会检查：

- JSON / TOML 语法是否错误
- 同一个配置里是否有重复 server 名称
- 不同工具里同名 MCP server 的配置是否不一致
- MCP command 是否在本机不存在
- 是否使用了风险较高的 stdio 命令模式，比如 `bash`、`sh`、`sudo`、`rm -rf`、`curl | sh`

如果命令参数里看起来像 token、api key、secret、password，它会在输出里做脱敏。

### 3. 安全边界

检查敏感文件和目录有没有被 Git 与 Agent 规则共同保护。

当前会识别这些敏感文件：

- `.env`
- `.env.local`
- `.env.production`
- `id_rsa`
- `id_ed25519`
- `credentials.json`
- `secrets.json`

也会识别这些敏感目录：

- `secrets`
- `private`
- `13pwd`

它会关注两个问题：

- `.gitignore` 有没有忽略这些路径
- Agent 入口规则里有没有明确禁止读取这些路径

### 4. 本地 Agent 环境

检查你本机是否能检测到一些常见 AI Coding 工具：

- Codex CLI
- Claude Code CLI
- Gemini CLI
- Cursor MCP 配置
- OpenClaw 或 Harness

这部分主要是信息提示，不是阻断项。

### 5. 项目准备度

检查项目有没有基本的工程结构和自动化命令。

它会识别：

- `package.json`
- `pyproject.toml`
- `Cargo.toml`
- `go.mod`
- `Makefile`
- `pom.xml`

它会检查：

- 是否有测试命令
- 是否有 build 或 lint 命令
- `node_modules`、`dist`、`build`、`target`、`.venv` 等大目录或生成目录是否被 `.gitignore` 和 Agent 规则排除

## 常用命令清单

完整检查：

```bash
npx @pigcw/agentpack doctor
```

只检查安全边界：

```bash
npx @pigcw/agentpack doctor --only security
```

只检查 MCP：

```bash
npx @pigcw/agentpack doctor --only mcp
```

输出 JSON：

```bash
npx @pigcw/agentpack doctor --json
```

用于 CI：

```bash
npx @pigcw/agentpack doctor --ci
```

预览修复建议：

```bash
npx @pigcw/agentpack fix --dry-run
```

## 报告怎么看

报告里会有：

- readiness score：准备度分数
- status：当前状态
- categories：各分类结果
- findings：具体问题
- evidence：证据
- recommended action：建议动作
- top actions：最优先处理的 3 个动作

状态含义：

| 状态 | 含义 |
| --- | --- |
| `ready` | 暂时没有发现阻断问题。 |
| `needs_attention` | 有一些 warning 或 info，建议处理。 |
| `not_ready` | 有 critical 问题，建议先修再交给 Agent。 |

## CI 退出码

| 退出码 | 含义 |
| ---: | --- |
| `0` | 命令执行成功；在 `--ci` 模式下表示没有 critical 问题。 |
| `1` | `--ci` 模式下发现了一个或多个 critical 问题。 |
| `2` | 参数错误、不支持的命令或工具错误。 |

## 隐私和安全

AgentPack Doctor v0.1 是本地、只读、确定性的工具。

它不会：

- 上传文件内容
- 在扫描时请求网络
- 打印密钥内容
- 写入文件
- 自动修复文件

它输出的证据主要是路径、配置 key、解析位置、命令名称和脱敏后的命令片段。

## 推荐使用流程

1. 进入项目根目录。
2. 运行：

```bash
npx @pigcw/agentpack doctor
```

3. 优先处理 `Top 3 Actions`。
4. 如果有 critical 问题，先修掉。
5. 再运行一次 `doctor`。
6. 确认没有阻断项后，再把任务交给 AI Coding Agent。

## 当前版本边界

v0.1 已经能做：

- 项目交接准备度检查
- MCP 配置检查
- 敏感文件和目录边界检查
- 本地 Agent 环境提示
- JSON 输出
- CI 模式
- dry-run 修复预览

v0.1 还不会做：

- 自动写入修复
- 深度代码质量分析
- 真实密钥泄露扫描
- 多模型诊断
- 跨项目 MCP 配置同步
- 图形界面

这些可以作为后续版本继续迭代。

## 本地开发

```bash
npm install
npm run build
npm test
```

从源码运行 CLI：

```bash
npm run dev -- doctor
```

## License

MIT
