/**
 * Feishu Chat Importer
 * 
 * 从飞书导出的聊天记录中提取消息
 * 支持格式：JSON, CSV, Markdown
 */

const fs = require('fs');
const path = require('path');

class FeishuImporter {
  constructor(options = {}) {
    this.options = {
      encoding: 'utf-8',
      ...options
    };
  }

  /**
   * 导入飞书聊天记录
   * @param {string} filePath - 导出文件路径
   * @param {string} format - 文件格式 (json|csv|md)
   * @returns {Promise<ChatData>}
   */
  async import(filePath, format = 'json') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在：${filePath}`);
    }

    console.log(`📥 正在导入飞书聊天记录：${filePath}`);
    console.log(`格式：${format}`);

    switch (format.toLowerCase()) {
      case 'json':
        return this._importJson(filePath);
      case 'csv':
        return this._importCsv(filePath);
      case 'md':
        return this._importMarkdown(filePath);
      default:
        throw new Error(`不支持的格式：${format}`);
    }
  }

  /**
   * 从 JSON 导入
   */
  _importJson(filePath) {
    const content = fs.readFileSync(filePath, this.options.encoding);
    const data = JSON.parse(content);

    return this._normalizeData(data);
  }

  /**
   * 从 CSV 导入
   */
  _importCsv(filePath) {
    const content = fs.readFileSync(filePath, this.options.encoding);
    const lines = content.split('\n');
    
    // 简单的 CSV 解析（实际应该用 csv-parse 库）
    const headers = lines[0].split(',').map(h => h.trim());
    const messages = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const msg = {};
      
      headers.forEach((header, index) => {
        msg[header] = values[index] || '';
      });

      messages.push(msg);
    }

    return this._normalizeData({ messages });
  }

  /**
   * 从 Markdown 导入
   */
  _importMarkdown(filePath) {
    const content = fs.readFileSync(filePath, this.options.encoding);
    
    // 解析 Markdown 格式的聊天记录
    const messages = [];
    const lines = content.split('\n');
    
    let currentSender = null;
    let currentTime = null;
    let currentContent = [];

    for (const line of lines) {
      // 匹配发送者行：**张三** 2024-01-01 10:00:00
      const senderMatch = line.match(/^\*\*(.+?)\*\*\s+(.+)/);
      
      if (senderMatch) {
        // 保存上一条消息
        if (currentSender && currentContent.length > 0) {
          messages.push({
            sender: currentSender,
            timestamp: currentTime,
            content: currentContent.join('\n'),
            message_id: null
          });
        }

        currentSender = senderMatch[1];
        currentTime = senderMatch[2];
        currentContent = [];
      } else if (currentSender) {
        currentContent.push(line);
      }
    }

    // 保存最后一条消息
    if (currentSender && currentContent.length > 0) {
      messages.push({
        sender: currentSender,
        timestamp: currentTime,
        content: currentContent.join('\n'),
        message_id: null
      });
    }

    return this._normalizeData({ messages });
  }

  /**
   * 标准化数据结构
   */
  _normalizeData(rawData) {
    const messages = rawData.messages || [];
    
    // 提取时间范围
    const timestamps = messages
      .map(m => m.timestamp)
      .filter(t => t)
      .sort();

    const timeRange = {
      start: timestamps[0] || null,
      end: timestamps[timestamps.length - 1] || null
    };

    // 提取参与者
    const participants = [...new Set(messages.map(m => m.sender))];

    return {
      source: 'feishu',
      timeRange,
      totalMessages: messages.length,
      participants,
      messages: messages.map((msg, index) => ({
        id: msg.message_id || `msg_${index}`,
        sender: msg.sender,
        timestamp: msg.timestamp,
        content: msg.content,
        type: msg.type || 'text',
        metadata: msg.metadata || {}
      }))
    };
  }

  /**
   * 导出为中间格式（用于分析）
   */
  toIntermediateFormat(chatData, outputPath) {
    const intermediate = {
      version: '1.0',
      source: chatData.source,
      exportedAt: new Date().toISOString(),
      summary: {
        totalMessages: chatData.totalMessages,
        timeRange: chatData.timeRange,
        participants: chatData.participants
      },
      messages: chatData.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        timestamp: msg.timestamp,
        content: msg.content,
        // 移除敏感元数据
        metadata: {}
      }))
    };

    fs.writeFileSync(outputPath, JSON.stringify(intermediate, null, 2), 'utf-8');
    console.log(`✅ 中间格式已保存到：${outputPath}`);
    
    return intermediate;
  }
}

module.exports = FeishuImporter;
