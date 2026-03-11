/**
 * User Profile Analyzer
 * 
 * 使用 AI 分析聊天记录，生成用户画像
 */

const fs = require('fs');
const path = require('path');

class ProfileAnalyzer {
  constructor(options = {}) {
    this.options = {
      model: 'qwen3.5-plus', // 默认使用 Qwen
      ...options
    };
  }

  /**
   * 分析聊天记录并生成用户画像
   * @param {ChatData} chatData - 聊天数据
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<string>} 生成的画像内容
   */
  async analyze(chatData, outputPath) {
    console.log('🧠 正在分析聊天记录...');
    console.log(`消息总数：${chatData.totalMessages}`);
    console.log(`时间跨度：${chatData.timeRange.start} ~ ${chatData.timeRange.end}`);
    console.log(`参与者：${chatData.participants.join(', ')}`);

    // 准备分析提示
    const prompt = this._buildAnalysisPrompt(chatData);
    
    // 调用 AI 分析（这里需要集成实际的 AI API）
    const profileContent = await this._callAI(prompt);
    
    // 写入文件
    fs.writeFileSync(outputPath, profileContent, 'utf-8');
    console.log(`✅ 用户画像已保存到：${outputPath}`);
    
    return profileContent;
  }

  /**
   * 构建 AI 分析提示
   */
  _buildAnalysisPrompt(chatData) {
    // 采样消息（避免 token 超限）
    const sampledMessages = this._sampleMessages(chatData.messages, 200);
    
    // 格式化消息为文本
    const messagesText = sampledMessages.map(msg => 
      `[${msg.timestamp || '未知时间'}] ${msg.sender}: ${msg.content.substring(0, 500)}`
    ).join('\n');

    return `你是一个专业的用户画像分析助手。请分析以下聊天记录，提取用户的关键信息，生成结构化的用户画像。

## 数据概览
- 数据来源：${chatData.source}
- 消息数量：${chatData.totalMessages} 条（采样 ${sampledMessages.length} 条）
- 时间范围：${chatData.timeRange.start} ~ ${chatData.timeRange.end}
- 参与者：${chatData.participants.join(', ')}

## 聊天样本
${messagesText}

## 任务
请从以上聊天记录中提取以下信息，生成 Markdown 格式的用户画像：

### 必填信息
1. **基础信息**
   - 用户称呼（从对话中推断）
   - 时区（从时间戳或对话内容推断）
   - 主要语言
   - 活跃时间段

2. **核心项目**
   - 正在进行的 project
   - 技术栈
   - 当前阶段和优先级

### 可选信息（如有相关内容）
3. **行为特征**
   - 沟通风格
   - 决策模式
   - 工作习惯

4. **偏好与兴趣**
   - 技术偏好（语言、框架、工具）
   - 工具偏好
   - 内容兴趣

5. **人际关系**
   - 重要联系人
   - 协作模式

6. **记忆规则**
   - 用户明确说"记住"的内容
   - 隐私边界

## 输出要求
1. 严格按照以下 Markdown 格式输出：

\`\`\`markdown
# 用户画像 - [称呼]

## 📅 生成信息
- 数据来源：[来源]
- 时间跨度：[开始 ~ 结束]
- 总消息数：[数字]
- 生成时间：[当前时间]

---

## 👤 基础信息
- **称呼**：[称呼]
- **时区**：[时区]
- **语言**：[语言]
- **活跃时间**：[描述]

---

## 🎯 核心项目
### [项目名]
- **角色**：[角色]
- **技术栈**：[技术]
- **当前阶段**：[阶段]
- **优先级任务**：[任务]

---

## 🧠 行为特征
### 沟通风格
- [描述]

### 决策模式
- [描述]

### 工作习惯
- [描述]

---

## ❤️ 偏好与兴趣
### 技术偏好
- 语言：[列表]
- 框架：[列表]
- 工具：[列表]

### 工具偏好
- [描述]

### 内容兴趣
- [列表]

---

## 👥 人际关系
### 重要联系人
- [描述]

### 协作模式
- [描述]

---

## 📝 记忆规则
### 需要记住的
- [列表]

### 隐私边界
- [描述]

---

## 📊 统计摘要
| 维度 | 详情 |
|------|------|
| 对话天数 | [数字] |
| 高频话题 | [话题] |
| 情绪倾向 | [倾向] |

---

## 🔗 原始数据引用
- [引用描述](source: [message_id/时间]) - [上下文]
\`\`\`

2. 对于推测的信息，标注置信度：
   \`\`\`markdown
   ### 推测信息（置信度：70%）
   - [推测内容]（推断依据）
   \`\`\`

3. 只输出 Markdown 内容，不要额外解释。
4. 如果某些信息无法从对话中推断，留空或写"未知"。
5. 引用具体对话片段时，使用消息时间戳作为来源。
`;
  }

  /**
   * 采样消息（保持时间分布均匀）
   */
  _sampleMessages(messages, maxCount) {
    if (messages.length <= maxCount) {
      return messages;
    }

    const step = Math.floor(messages.length / maxCount);
    const sampled = [];

    for (let i = 0; i < messages.length; i += step) {
      sampled.push(messages[i]);
      if (sampled.length >= maxCount) break;
    }

    return sampled;
  }

  /**
   * 调用 AI 进行分析
   * 
   * TODO: 集成实际的 AI API（Qwen/Claude/GPT）
   * 目前返回示例内容用于测试
   */
  async _callAI(prompt) {
    // TODO: 实现实际的 AI 调用
    // 示例：使用 OpenClaw 的 sessions_spawn 或直接调用 API
    
    console.log('⚠️  AI 调用尚未实现，返回示例画像...');
    
    return `# 用户画像 - 开发者

## 📅 生成信息
- 数据来源：feishu
- 时间跨度：2024-01-01 ~ 2026-03-11
- 总消息数：1245
- 生成时间：2026-03-11 17:40:00

---

## 👤 基础信息
- **称呼**：开发者
- **时区**：GMT+8
- **语言**：中文
- **活跃时间**：工作日 9:00-23:00

---

## 🎯 核心项目
### TapSpot
- **角色**：开发者/创始人
- **技术栈**：Go 1.21+, React 18, MySQL, Docker
- **当前阶段**：商业化准备
- **优先级任务**：图片上传、通知系统、关注系统

### OpenMemClaw
- **角色**：开发者
- **技术栈**：Node.js
- **当前阶段**：设计阶段
- **优先级任务**：基础框架搭建

---

## 🧠 行为特征
### 沟通风格
- 直接、高效
- 偏好简洁回复
- 技术讨论时详细

### 决策模式
- 快速迭代，先做再优化
- 重视实用性

### 工作习惯
- 下午/晚上处理技术任务
- 使用 git 管理项目
- 偏好命令行工具

---

## ❤️ 偏好与兴趣
### 技术偏好
- 语言：Go, JavaScript/TypeScript
- 数据库：MySQL
- 部署：Docker

### 工具偏好
- 协作工具：飞书
- 版本控制：Git + GitHub

### 内容兴趣
- AI/LLM 技术
- 社交产品开发
- 商业化策略

---

## 👥 人际关系
### 重要联系人
- 待提取

### 协作模式
- 待提取

---

## 📝 记忆规则
### 需要记住的
- 项目进度和决策
- 技术偏好

### 隐私边界
- 不公开私人对话

---

## 📊 统计摘要
| 维度 | 详情 |
|------|------|
| 对话天数 | 145 |
| 高频话题 | TapSpot, OpenClaw, 技术讨论 |
| 情绪倾向 | 积极/务实 |

---

## 🔗 原始数据引用
- 待补充
`;
  }
}

module.exports = ProfileAnalyzer;
