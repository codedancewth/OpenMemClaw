#!/usr/bin/env node

/**
 * OpenMemClaw - 简化版记忆备份工具
 * 
 * 直接从 OpenClaw 工作区提取记忆文件，生成用户画像
 */

const fs = require('fs');
const path = require('path');

class MemoryBackup {
  constructor(workspacePath) {
    this.workspace = workspacePath || process.cwd();
  }

  /**
   * 备份用户记忆
   */
  async backup(outputPath) {
    console.log('📦 正在备份 OpenClaw 记忆...');
    console.log(`工作区：${this.workspace}`);

    // 读取记忆文件
    const memoryMd = this._readFile('MEMORY.md');
    const userMd = this._readFile('USER.md');
    const memoryFiles = this._readMemoryDir();

    // 生成用户画像
    const profile = this._generateProfile(memoryMd, userMd, memoryFiles);

    // 写入文件
    const output = outputPath || 'user-profile.md';
    fs.writeFileSync(output, profile, 'utf-8');
    console.log(`✅ 备份完成：${output}`);

    return { output, profile };
  }

  /**
   * 读取文件（如果存在）
   */
  _readFile(filename) {
    const filePath = path.join(this.workspace, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
  }

  /**
   * 读取 memory/ 目录下的文件
   */
  _readMemoryDir() {
    const memoryDir = path.join(this.workspace, 'memory');
    const files = {};

    if (fs.existsSync(memoryDir)) {
      const items = fs.readdirSync(memoryDir);
      for (const item of items) {
        if (item.endsWith('.md')) {
          const content = fs.readFileSync(path.join(memoryDir, item), 'utf-8');
          files[item] = content;
        }
      }
    }

    return files;
  }

  /**
   * 生成用户画像
   */
  _generateProfile(memoryMd, userMd, memoryFiles) {
    const now = new Date().toISOString();

    return `# 用户画像 - OpenClaw 记忆备份

## 📅 生成信息
- 来源：OpenClaw 工作区
- 工作区：${this.workspace}
- 生成时间：${now}
- 记忆文件数：${Object.keys(memoryFiles).length}

---

## 📝 MEMORY.md

${memoryMd || '无 MEMORY.md 文件'}

---

## 👤 USER.md

${userMd || '无 USER.md 文件'}

---

## 📂 memory/ 目录

${Object.entries(memoryFiles)
  .map(([filename, content]) => `### ${filename}\n\n${content}\n`)
  .join('\n') || '无记忆文件'}

---

*此文件由 OpenMemClaw 自动生成，可用于迁移到新的 OpenClaw 实例*
`;
  }

  /**
   * 恢复记忆到新工作区
   */
  async restore(profilePath, targetWorkspace) {
    console.log('🔄 正在恢复记忆...');
    console.log(`画像文件：${profilePath}`);
    console.log(`目标工作区：${targetWorkspace}`);

    const content = fs.readFileSync(profilePath, 'utf-8');

    // 解析画像文件
    const sections = this._parseProfile(content);

    // 写入文件
    if (sections.memoryMd) {
      this._writeFile(targetWorkspace, 'MEMORY.md', sections.memoryMd);
    }
    if (sections.userMd) {
      this._writeFile(targetWorkspace, 'USER.md', sections.userMd);
    }
    if (sections.memoryFiles) {
      const memoryDir = path.join(targetWorkspace, 'memory');
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      for (const [filename, content] of Object.entries(sections.memoryFiles)) {
        this._writeFile(memoryDir, filename, content);
      }
    }

    console.log('✅ 恢复完成!');
  }

  /**
   * 解析画像文件
   */
  _parseProfile(content) {
    const sections = {};

    // 提取 MEMORY.md
    const memoryMatch = content.match(/## 📝 MEMORY\.md\n\n([\s\S]*?)(?=\n---\n\n##|$)/);
    if (memoryMatch && memoryMatch[1] !== '无 MEMORY.md 文件') {
      sections.memoryMd = memoryMatch[1];
    }

    // 提取 USER.md
    const userMatch = content.match(/## 👤 USER\.md\n\n([\s\S]*?)(?=\n---\n\n##|$)/);
    if (userMatch && userMatch[1] !== '无 USER.md 文件') {
      sections.userMd = userMatch[1];
    }

    // 提取 memory/ 文件
    const memoryFilesMatch = content.match(/## 📂 memory\/目录\n\n([\s\S]*?)$/);
    if (memoryFilesMatch && memoryFilesMatch[1] !== '无记忆文件') {
      const files = {};
      const fileBlocks = memoryFilesMatch[1].split(/^###\s+/m).filter(b => b.trim());
      
      for (const block of fileBlocks) {
        const lines = block.trim().split('\n');
        const filename = lines[0].trim();
        const fileContent = lines.slice(1).join('\n').trim();
        if (filename && fileContent) {
          files[filename] = fileContent;
        }
      }
      
      if (Object.keys(files).length > 0) {
        sections.memoryFiles = files;
      }
    }

    return sections;
  }

  /**
   * 写入文件
   */
  _writeFile(dir, filename, content) {
    const filePath = path.join(dir, filename);
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ ${filename}`);
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'backup') {
    const workspace = args[1] || process.cwd();
    const output = args[2] || 'user-profile.md';
    
    const backup = new MemoryBackup(workspace);
    await backup.backup(output);
  } else if (command === 'restore') {
    const profilePath = args[1];
    const target = args[2] || process.cwd();

    if (!profilePath) {
      console.error('❌ 请指定画像文件路径');
      process.exit(1);
    }

    const backup = new MemoryBackup();
    await backup.restore(profilePath, target);
  } else {
    console.log(`
📦 OpenMemClaw - 记忆备份工具

用法:
  node backup.js backup [工作区路径] [输出文件]
  node backup.js restore <画像文件> [目标工作区]

示例:
  node backup.js backup /root/.openclaw/workspace
  node backup.js backup . user-profile.md
  node backup.js restore user-profile.md /tmp/new-workspace
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = MemoryBackup;
