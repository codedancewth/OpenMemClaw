# OpenMemClaw 🧠

> OpenClaw 记忆备份与迁移工具 - 简单、安全

---

## 📖 简介

**OpenMemClaw** 是一个超简单的 OpenClaw 记忆备份工具：

- 📦 **备份** - 将 OpenClaw 工作区的记忆文件汇总成一个 `user-profile.md`
- 🔄 **恢复** - 将备份文件恢复到新的 OpenClaw 工作区
- 🚀 **迁移** - 在不同 OpenClaw 实例之间迁移记忆
- 🔒 **安全** - 自动过滤敏感信息（API 密钥、密码、配置等）

**不需要复杂的 AI 分析，直接读取现有文件！**

---

## 🔐 安全策略

备份时自动过滤以下内容：

**❌ 移除：**
- API Keys (`sk-xxx`, `apiKey`)
- Secrets (`appSecret`, `password`)
- Tokens (`auth_token`)
- 配置信息 (App ID, connection_mode, group_policy)
- Feishu Configuration 章节
- Security Notes 章节
- 授权链接中的敏感参数

**✅ 保留：**
- 用户项目信息 (Projects)
- 用户偏好 (Preferences)
- 用户基本信息 (USER.md)
- 记忆规则 (Memory Rules)
- 关键决策 (Key Decisions)
- 日常记忆 (memory/*.md)

**备份文件可安全分享，不包含任何密钥或配置！**

---

## 🚀 快速开始

### 备份记忆

```bash
# 备份当前工作区
node src/backup.js backup

# 备份指定工作区
node src/backup.js backup /root/.openclaw/workspace

# 备份并指定输出文件
node src/backup.js backup /root/.openclaw/workspace my-backup.md
```

### 恢复记忆

```bash
# 恢复到新工作区
node src/backup.js restore user-profile.md /tmp/new-workspace
```

---

## 📋 命令参考

### `backup` - 备份记忆

```bash
node src/backup.js backup [工作区路径] [输出文件]
```

**参数：**
- `工作区路径` - OpenClaw 工作区路径（默认：当前目录）
- `输出文件` - 输出文件名（默认：user-profile.md）

**示例：**
```bash
# 备份当前目录
node src/backup.js backup

# 备份 OpenClaw 工作区
node src/backup.js backup /root/.openclaw/workspace backup.md
```

### `restore` - 恢复记忆

```bash
node src/backup.js restore <画像文件> [目标工作区]
```

**参数：**
- `画像文件` - 备份文件路径（必填）
- `目标工作区` - 目标 OpenClaw 工作区（默认：当前目录）

**示例：**
```bash
# 恢复到当前目录
node src/backup.js restore user-profile.md

# 恢复到新工作区
node src/backup.js restore backup.md /tmp/new-workspace
```

---

## 📁 备份内容

备份文件包含：

1. **MEMORY.md** - 长期记忆（项目、偏好等）
2. **USER.md** - 用户信息
3. **memory/*.md** - 日常记忆文件

### 生成的备份文件格式

```markdown
# 用户画像 - OpenClaw 记忆备份

## 📅 生成信息
- 来源：OpenClaw 工作区
- 工作区：/root/.openclaw/workspace
- 生成时间：2026-03-11T10:52:21.490Z
- 记忆文件数：9

---

## 📝 MEMORY.md

[MEMORY.md 完整内容]

---

## 👤 USER.md

[USER.md 完整内容]

---

## 📂 memory/ 目录

### 2026-03-10.md
[文件内容]

### 2026-03-11.md
[文件内容]
```

---

## 🔄 使用场景

### 场景 1：迁移到新设备

```bash
# 旧设备：备份
node src/backup.js backup /root/.openclaw/workspace backup.md

# 复制 backup.md 到新设备

# 新设备：恢复
node src/backup.js restore backup.md /root/.openclaw/workspace
```

### 场景 2：备份当前记忆

```bash
# 定期备份
node src/backup.js backup /root/.openclaw/workspace ~/backups/openclaw-$(date +%Y%m%d).md
```

### 场景 3：测试新配置

```bash
# 备份当前记忆
node src/backup.js backup /root/.openclaw/workspace backup.md

# 恢复到测试工作区
node src/backup.js restore backup.md /tmp/test-workspace

# 在测试工作区实验新配置...
```

---

## 📊 项目结构

```
OpenMemClaw/
├── src/
│   ├── backup.js          # 核心备份/恢复功能
│   └── index.js           # 旧版 CLI（保留）
├── docs/
│   └── USER_PROFILE_SCHEMA.md
├── examples/
│   └── user-profile-example.md
└── README.md
```

---

## ⚙️ 进阶用法

### 作为 Node.js 模块使用

```javascript
const MemoryBackup = require('./src/backup');

// 备份
const backup = new MemoryBackup('/root/.openclaw/workspace');
await backup.backup('my-backup.md');

// 恢复
await backup.restore('my-backup.md', '/tmp/new-workspace');
```

### 集成到 OpenClaw 命令

可以将备份功能集成到 OpenClaw 的自定义命令中：

```javascript
// OpenClaw 技能
async function backupMemory() {
  const MemoryBackup = require('openmemclaw/src/backup');
  const backup = new MemoryBackup(workspace);
  await backup.backup('user-profile.md');
  return '记忆已备份到 user-profile.md';
}
```

---

## 🆚 与旧版对比

| 功能 | 旧版 (index.js) | 新版 (backup.js) |
|------|----------------|-----------------|
| 聊天记录导入 | ✅ | ❌ |
| AI 分析 | ✅ | ❌ |
| 直接备份 | ❌ | ✅ |
| 恢复功能 | ✅ | ✅ |
| 复杂度 | 高 | 低 |
| 推荐使用 | 分析聊天记录 | 备份/迁移记忆 |

---

## 📄 许可证

MIT

---

## 🙏 致谢

- OpenClaw - AI 助手框架
