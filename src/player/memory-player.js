/**
 * Memory Player
 * 
 * 将用户画像回放为 OpenClaw 标准记忆格式
 * 支持迁移到新的 OpenClaw 实例
 */

const fs = require('fs');
const path = require('path');

class MemoryPlayer {
  constructor(options = {}) {
    this.options = {
      dryRun: false,
      merge: false,
      ...options
    };
  }

  /**
   * 回放用户画像到 OpenClaw 工作区
   * @param {string} profilePath - user-profile.md 路径
   * @param {string} targetWorkspace - 目标 OpenClaw 工作区
   * @returns {Promise<PlayResult>}
   */
  async play(profilePath, targetWorkspace) {
    console.log('🎮 正在回放记忆...');
    console.log(`画像文件：${profilePath}`);
    console.log(`目标工作区：${targetWorkspace}`);

    // 读取画像文件
    const profileContent = fs.readFileSync(profilePath, 'utf-8');
    const profile = this._parseProfile(profileContent);

    // 生成 OpenClaw 记忆文件
    const files = this._generateOpenClawFiles(profile);

    if (this.options.dryRun) {
      console.log('\n📋 [预览模式] 将生成以下文件:\n');
      for (const [filename, content] of Object.entries(files)) {
        console.log(`--- ${filename} ---`);
        console.log(content.substring(0, 500) + '...\n');
      }
      return { files, written: false };
    }

    // 写入文件
    await this._writeFiles(files, targetWorkspace);
    
    console.log('\n✅ 记忆回放完成!');
    console.log(`已生成 ${Object.keys(files).length} 个文件到：${targetWorkspace}`);

    return { files, written: true };
  }

  /**
   * 解析用户画像 Markdown
   */
  _parseProfile(content) {
    const profile = {
      meta: {},
      basicInfo: {},
      projects: [],
      behavior: {},
      preferences: {},
      relationships: {},
      memoryRules: {},
      stats: {},
      references: []
    };

    // 按 ## 分割大章节
    const sections = content.split(/\n##\s+/);

    for (const section of sections) {
      if (section.includes('📅 生成信息')) {
        profile.meta = this._parseKeyValueBlock(section);
      } else if (section.includes('👤 基础信息')) {
        profile.basicInfo = this._parseKeyValueBlock(section);
      } else if (section.includes('🎯 核心项目')) {
        profile.projects = this._parseProjects(section);
      } else if (section.includes('🧠 行为特征')) {
        profile.behavior = this._parseSubsections(section);
      } else if (section.includes('❤️ 偏好与兴趣')) {
        profile.preferences = this._parseSubsections(section);
      } else if (section.includes('👥 人际关系')) {
        profile.relationships = this._parseSubsections(section);
      } else if (section.includes('📝 记忆规则')) {
        profile.memoryRules = this._parseSubsections(section);
      } else if (section.includes('📊 统计摘要')) {
        profile.stats = this._parseTable(section);
      } else if (section.includes('🔗 原始数据引用')) {
        profile.references = this._parseReferences(section);
      }
    }

    return profile;
  }

  /**
   * 解析键值对块
   */
  _parseKeyValueBlock(text) {
    const result = {};
    const lines = text.trim().split('\n');
    
    for (const line of lines) {
      // 匹配：- **key**: value  或  **key**: value (支持中英文冒号)
      const match = line.match(/^-?\s*\*\*(.+?)\*\*\s*[:：]\s*(.+)/);
      if (match) {
        result[match[1].trim()] = match[2].trim();
      }
    }
    
    return result;
  }

  /**
   * 解析项目列表
   */
  _parseProjects(text) {
    const projects = [];
    const lines = text.split('\n');
    
    // 找到第一个 ### 开头的项目
    let inProjects = false;
    let currentProject = null;
    let currentLines = [];

    for (const line of lines) {
      // 跳过章节标题行（包含 emoji 的）
      if (line.startsWith('### ') && !line.includes('🎯')) {
        // 保存上一个项目
        if (currentProject && currentLines.length > 0) {
          projects.push({
            name: currentProject,
            ...this._parseKeyValueBlock(currentLines.join('\n'))
          });
        }
        
        // 开始新项目
        currentProject = line.replace(/^###\s+/, '').trim();
        currentLines = [];
        inProjects = true;
      } else if (inProjects && line.trim() && !line.startsWith('##')) {
        currentLines.push(line);
      }
    }

    // 保存最后一个项目
    if (currentProject && currentLines.length > 0) {
      projects.push({
        name: currentProject,
        ...this._parseKeyValueBlock(currentLines.join('\n'))
      });
    }

    return projects;
  }

  /**
   * 解析子章节
   */
  _parseSubsections(text) {
    const result = {};
    const lines = text.split('\n');
    
    let currentTitle = null;
    let currentContent = [];

    for (const line of lines) {
      // 跳过 ## 开头的章节标题（包含 emoji 的）
      if (line.startsWith('## ')) {
        continue;
      }
      
      // 检测 ### 子章节标题
      if (line.startsWith('### ')) {
        // 保存上一个子章节
        if (currentTitle && currentContent.length > 0) {
          const content = currentContent.join('\n').trim();
          if (content.startsWith('-')) {
            result[currentTitle] = content.split('\n')
              .map(l => l.replace(/^-?\s*/, '')).filter(l => l);
          } else {
            result[currentTitle] = content;
          }
        }
        
        // 开始新的子章节
        currentTitle = line.replace(/^###\s+/, '').trim();
        currentContent = [];
      } else if (currentTitle && line.trim()) {
        currentContent.push(line);
      }
    }

    // 保存最后一个子章节
    if (currentTitle && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (content.startsWith('-')) {
        result[currentTitle] = content.split('\n')
          .map(l => l.replace(/^-?\s*/, '')).filter(l => l);
      } else {
        result[currentTitle] = content;
      }
    }

    return result;
  }

  /**
   * 解析表格
   */
  _parseTable(text) {
    const result = {};
    const lines = text.trim().split('\n').filter(l => l.includes('|'));
    
    // 跳过表头和分隔线
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        result[cells[0]] = cells[1];
      }
    }

    return result;
  }

  /**
   * 解析引用
   */
  _parseReferences(text) {
    const refs = [];
    const lines = text.trim().split('\n').filter(l => l.startsWith('-'));

    for (const line of lines) {
      const match = line.match(/^-?\s*\[([^\]]+)\]\(source:\s*([^)]+)\)\s*-\s*(.+)/);
      if (match) {
        refs.push({
          description: match[1],
          source: match[2],
          context: match[3]
        });
      }
    }

    return refs;
  }

  /**
   * 生成 OpenClaw 标准文件
   */
  _generateOpenClawFiles(profile) {
    const files = {};

    // 生成 MEMORY.md
    files['MEMORY.md'] = this._generateMemoryMd(profile);

    // 生成 USER.md
    files['USER.md'] = this._generateUserMd(profile);

    // 生成迁移日志
    const today = new Date().toISOString().split('T')[0];
    files[`memory/${today}.md`] = this._generateMigrationLog(profile);

    return files;
  }

  /**
   * 生成 MEMORY.md
   */
  _generateMemoryMd(profile) {
    const projects = profile.projects.map(p => `
### ${p.name}
${p.role ? `- **Role:** ${p.role}` : ''}
${p['技术栈'] ? `- **Tech Stack:** ${p['技术栈']}` : ''}
${p['当前阶段'] ? `- **Phase:** ${p['当前阶段']}` : ''}
${p['优先级任务'] ? `- **Priorities:** ${p['优先级任务']}` : ''}
`.trim()).join('\n\n');

    const prefs = Object.entries(profile.preferences)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `- ${key}: ${value.join(', ')}`;
        }
        return `- ${key}: ${value}`;
      })
      .join('\n');

    return `# MEMORY.md - Long-Term Memory

## Projects

${projects || '暂无项目'}

## Preferences

${prefs || '暂无偏好'}

## User Profile

${profile.basicInfo['称呼'] ? `- **Name:** ${profile.basicInfo['称呼']}` : ''}
${profile.basicInfo['时区'] ? `- **Timezone:** ${profile.basicInfo['时区']}` : ''}
${profile.basicInfo['活跃时间'] ? `- **Active Hours:** ${profile.basicInfo['活跃时间']}` : ''}

## Memory Rules

### Remember
${profile.memoryRules['需要记住的'] 
  ? (Array.isArray(profile.memoryRules['需要记住的']) 
      ? profile.memoryRules['需要记住的'].map(i => `- ${i}`).join('\n')
      : `- ${profile.memoryRules['需要记住的']}`)
  : '- 项目进度和关键决策'}

### Privacy
${profile.memoryRules['隐私边界'] || '不公开私人对话'}

---

*Generated by OpenMemClaw MemoryPlayer on ${new Date().toISOString()}*
`;
  }

  /**
   * 生成 USER.md
   */
  _generateUserMd(profile) {
    return `# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** ${profile.basicInfo['称呼'] || 'Unknown'}
- **What to call them:** ${profile.basicInfo['称呼'] || 'Unknown'}
- **Pronouns:** _optional_
- **Timezone:** ${profile.basicInfo['时区'] || 'Unknown'}
- **Notes:**

## Context

${profile.behavior['沟通风格'] || '待补充'}

---

_The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference._

*Generated by OpenMemClaw MemoryPlayer on ${new Date().toISOString()}*
`;
  }

  /**
   * 生成迁移日志
   */
  _generateMigrationLog(profile) {
    return `# Migration Log - ${new Date().toISOString().split('T')[0]}

## Source
- File: user-profile.md
- Generated by: OpenMemClaw

## Summary
- Projects migrated: ${profile.projects.length}
- Preferences migrated: ${Object.keys(profile.preferences).length}

## Notes
Memory replayed from user-profile.md to OpenClaw workspace.

---

*This is an auto-generated migration log.*
`;
  }

  /**
   * 写入文件到工作区
   */
  async _writeFiles(files, targetWorkspace) {
    for (const [filename, content] of Object.entries(files)) {
      const fullPath = path.join(targetWorkspace, filename);
      
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`  ✓ ${filename}`);
    }
  }
}

module.exports = MemoryPlayer;
