#!/usr/bin/env node

/**
 * OpenMemClaw CLI
 * 
 * 记忆汇总工具 - 从聊天记录生成用户画像
 */

const fs = require('fs');
const path = require('path');
const FeishuImporter = require('./importers/feishu-importer');
const ProfileAnalyzer = require('./analyzers/profile-analyzer');
const MemoryPlayer = require('./player/memory-player');

// CLI 命令
const commands = {
  import: async (args) => {
    const { file, format, output } = args;
    
    if (!file) {
      console.error('❌ 错误：请指定导入文件 --file <path>');
      process.exit(1);
    }

    const importer = new FeishuImporter();
    const chatData = await importer.import(file, format || 'json');
    
    if (output) {
      importer.toIntermediateFormat(chatData, output);
    }

    console.log(`✅ 导入完成：${chatData.totalMessages} 条消息`);
    return chatData;
  },

  analyze: async (args) => {
    const { input, output } = args;

    if (!input) {
      console.error('❌ 错误：请指定输入文件 --input <path>');
      process.exit(1);
    }

    // 读取中间格式数据
    const content = fs.readFileSync(input, 'utf-8');
    const chatData = JSON.parse(content);

    const analyzer = new ProfileAnalyzer();
    const outputPath = output || 'user-profile.md';
    
    await analyzer.analyze(chatData, outputPath);
  },

  play: async (args) => {
    const { profile, target, dryRun, merge } = args;

    if (!profile) {
      console.error('❌ 错误：请指定画像文件 --profile <path>');
      process.exit(1);
    }

    const player = new MemoryPlayer({ dryRun, merge });
    const targetWorkspace = target || process.cwd();

    await player.play(profile, targetWorkspace);
  },

  // 一键流程：导入 → 分析 → 生成画像
  process: async (args) => {
    const { file, format, output, target } = args;

    if (!file) {
      console.error('❌ 错误：请指定聊天导出文件 --file <path>');
      process.exit(1);
    }

    console.log('🚀 开始一键处理流程...\n');

    // Step 1: 导入
    console.log('📥 Step 1/3: 导入聊天记录');
    const importer = new FeishuImporter();
    const chatData = await importer.import(file, format || 'json');
    
    const intermediatePath = output || 'chat-intermediate.json';
    importer.toIntermediateFormat(chatData, intermediatePath);

    // Step 2: 分析
    console.log('\n🧠 Step 2/3: AI 分析生成画像');
    const analyzer = new ProfileAnalyzer();
    const profilePath = 'user-profile.md';
    await analyzer.analyze(chatData, profilePath);

    // Step 3: 回放（可选）
    if (target) {
      console.log('\n🎮 Step 3/3: 回放记忆到 OpenClaw 工作区');
      const player = new MemoryPlayer();
      await player.play(profilePath, target);
    }

    console.log('\n✅ 处理完成!');
    console.log(`中间数据：${intermediatePath}`);
    console.log(`用户画像：${profilePath}`);
    if (target) {
      console.log(`OpenClaw 记忆：${target}/`);
    }
  }
};

// 解析命令行参数
function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      parsed[key] = value;
    }
  }
  return parsed;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const options = parseArgs(args.slice(1));

  if (!commands[command]) {
    console.error(`❌ 未知命令：${command}`);
    printHelp();
    process.exit(1);
  }

  try {
    await commands[command](options);
  } catch (error) {
    console.error(`❌ 错误：${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🧠 OpenMemClaw - 记忆汇总工具

用法：openmemclaw <command> [options]

命令:
  import     导入聊天记录
  analyze    分析聊天记录生成用户画像
  play       回放用户画像到 OpenClaw 工作区
  process    一键流程（导入 → 分析 → 回放）

选项:
  --file <path>      输入文件路径
  --format <type>    文件格式 (json|csv|md)，默认：json
  --output <path>    输出文件路径
  --input <path>     分析输入文件（中间格式）
  --profile <path>   用户画像文件
  --target <path>    目标 OpenClaw 工作区
  --dry-run          预览模式，不写入文件
  --merge            合并到现有记忆（而非覆盖）

示例:
  # 导入飞书聊天记录
  openmemclaw import --file chat-export.json --format json

  # 分析并生成画像
  openmemclaw analyze --input chat-intermediate.json --output user-profile.md

  # 回放记忆到 OpenClaw
  openmemclaw play --profile user-profile.md --target /root/.openclaw/workspace

  # 一键处理
  openmemclaw process --file chat-export.json --target /root/.openclaw/workspace
`);
}

// 导出模块
module.exports = {
  FeishuImporter,
  ProfileAnalyzer,
  MemoryPlayer,
  commands
};

// 如果是直接运行
if (require.main === module) {
  main();
}
