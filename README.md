# OpenMemClaw 🧠

> OpenClaw 记忆汇总工具 - 从聊天记录生成用户画像，支持记忆回放迁移

---

## 📖 简介

OpenMemClaw 是一个双工具系统，用于：

1. **OpenMemClaw（记忆提取器）** - 分析聊天记录（飞书/Telegram/WhatsApp 等），生成结构化的用户画像文档
2. **MemoryPlayer（记忆回放器）** - 将用户画像转换为 OpenClaw 标准记忆格式，实现记忆迁移

### 使用场景

- ✅ 从旧 OpenClaw 实例迁移记忆到新实例
- ✅ 从聊天记录自动构建用户画像
- ✅ 备份和恢复 AI 助手记忆
- ✅ 多设备/多实例记忆同步

---

## 🚀 快速开始

### 安装

```bash
cd /root/.openclaw/workspace/OpenMemClaw
npm install
npm link  # 全局安装 openmemclaw 命令
```

### 一键处理

```bash
# 从飞书聊天记录生成画像并迁移到 OpenClaw
openmemclaw process \
  --file chat-export.json \
  --target /root/.openclaw/workspace
```

### 分步执行

```bash
# Step 1: 导入聊天记录
openmemclaw import --file chat-export.json --format json

# Step 2: AI 分析生成画像
openmemclaw analyze --input chat-intermediate.json --output user-profile.md

# Step 3: 回放记忆到 OpenClaw
openmemclaw play --profile user-profile.md --target /root/.openclaw/workspace
```

---

## 📋 命令参考

### `import` - 导入聊天记录

```bash
openmemclaw import --file <path> [--format json|csv|md] [--output <path>]
```

**选项：**
- `--file` - 聊天记录导出文件路径（必填）
- `--format` - 文件格式，默认：json
- `--output` - 输出中间格式文件路径

### `analyze` - 分析生成画像

```bash
openmemclaw analyze --input <path> [--output <path>]
```

**选项：**
- `--input` - 中间格式 JSON 文件路径（必填）
- `--output` - 输出画像文件路径，默认：user-profile.md

### `play` - 回放记忆

```bash
openmemclaw play --profile <path> [--target <path>] [--dry-run] [--merge]
```

**选项：**
- `--profile` - 用户画像文件路径（必填）
- `--target` - 目标 OpenClaw 工作区，默认：当前目录
- `--dry-run` - 预览模式，不写入文件
- `--merge` - 合并到现有记忆（而非覆盖）

### `process` - 一键流程

```bash
openmemclaw process --file <path> [--target <path>]
```

**选项：**
- `--file` - 聊天记录导出文件（必填）
- `--target` - 目标 OpenClaw 工作区（可选）

---

## 📁 项目结构

```
OpenMemClaw/
├── src/
│   ├── index.js              # CLI 入口
│   ├── importers/
│   │   └── feishu-importer.js  # 飞书导入器
│   ├── analyzers/
│   │   └── profile-analyzer.js # 画像分析器
│   └── player/
│       └── memory-player.js    # 记忆回放器
├── docs/
│   └── USER_PROFILE_SCHEMA.md  # 画像格式规范
├── examples/
│   └── user-profile-example.md # 示例画像
└── package.json
```

---

## 📝 用户画像格式

OpenMemClaw 生成标准化的 `user-profile.md` 文件，包含：

- 📅 生成信息（数据来源、时间范围）
- 👤 基础信息（称呼、时区、语言）
- 🎯 核心项目（技术栈、阶段、优先级）
- 🧠 行为特征（沟通风格、决策模式）
- ❤️ 偏好与兴趣（技术、工具、内容）
- 👥 人际关系（联系人、协作模式）
- 📝 记忆规则（记住什么、隐私边界）
- 📊 统计摘要
- 🔗 原始数据引用

详见：[docs/USER_PROFILE_SCHEMA.md](docs/USER_PROFILE_SCHEMA.md)

---

## 🔄 记忆迁移流程

```
┌──────────────────────┐         ┌──────────────────────┐
│   OpenMemClaw        │         │   MemoryPlayer       │
│   (记忆提取器)        │         │   (记忆回放器)        │
│                      │         │                      │
│  飞书聊天记录         │         │  user-profile.md     │
│       ↓              │         │       ↓              │
│  AI 分析汇总          │         │  格式转换            │
│       ↓              │         │       ↓              │
│  user-profile.md     │  ───►   │  MEMORY.md           │
│  (综合画像)          │  导入    │  USER.md             │
│                      │         │  memory/YYYY-MM-DD.md │
└──────────────────────┘         └──────────────────────┘
```

### 生成的 OpenClaw 文件

```
workspace/
├── MEMORY.md              # 长期记忆（项目、偏好）
├── USER.md                # 用户基本信息
└── memory/
    └── YYYY-MM-DD.md      # 迁移日志
```

---

## ⚙️ 配置

### AI 模型配置

默认使用 Qwen3.5-plus，可在 `src/analyzers/profile-analyzer.js` 中修改：

```javascript
const analyzer = new ProfileAnalyzer({
  model: 'qwen3.5-plus'  // 或 'claude', 'gpt-4', etc.
});
```

### 飞书聊天记录导出

1. 打开飞书桌面客户端
2. 进入要导出的对话
3. 右键 → 导出聊天记录
4. 选择 JSON 格式（推荐）

---

## 🛠️ 开发

### 添加新的导入器

在 `src/importers/` 下创建新文件：

```javascript
class TelegramImporter {
  async import(filePath) {
    // 实现 Telegram 聊天记录解析
  }
}
```

### 扩展分析逻辑

修改 `src/analyzers/profile-analyzer.js` 中的 `_buildAnalysisPrompt` 方法。

---

## 📄 许可证

MIT

---

## 🙏 致谢

- OpenClaw - AI 助手框架
- Qwen - AI 分析模型
