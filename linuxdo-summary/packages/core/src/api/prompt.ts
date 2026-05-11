import type { AppConfig, TopicPayload } from '../types.js';

const DEFAULT_SYSTEM_PROMPT_ZH = `你是一个优秀的技术论坛内容总结助手。用户会给你一个 Linux.do 帖子的标题、原帖和部分回复。
请用简体中文输出 Markdown 格式的总结，包含以下部分：

## 一句话概括
## 原帖核心内容
## 高质量回复观点（分点列出，括注楼层号与作者）
## 争议 / 分歧点（如有）
## 结论 / 建议

要求：
- 客观中立，不编造未出现的事实。
- 尽量精炼，去除寒暄、签名与重复发言。
- 如果帖子是求助，结论部分给出最可行的解决方案。`;

const DEFAULT_SYSTEM_PROMPT_EN = `You are a skilled summarizer of technical forum threads. You will receive the title, original post, and some replies from a Linux.do topic.
Produce a concise Markdown summary in English with the following sections:

## TL;DR
## Original Post
## Notable Replies (bullet list, cite floor # and author)
## Disagreements (if any)
## Conclusion / Recommendation

Be objective, avoid speculation, and strip out greetings, signatures, and noise.`;

export function buildSystemPrompt(config: AppConfig): string {
  if (config.systemPrompt && config.systemPrompt.trim()) {
    return config.systemPrompt;
  }
  return config.language === 'en' ? DEFAULT_SYSTEM_PROMPT_EN : DEFAULT_SYSTEM_PROMPT_ZH;
}

export function buildUserPrompt(topic: TopicPayload, maxPosts: number): string {
  const posts = topic.posts.slice(0, Math.max(1, maxPosts));
  const lines: string[] = [];
  lines.push(`标题：${topic.title}`);
  lines.push(`链接：${topic.url}`);
  lines.push('');

  for (const p of posts) {
    const header =
      p.index === 1
        ? `# 原帖 @${p.author}`
        : `## #${p.index} @${p.author}${p.likes ? ` (赞 ${p.likes})` : ''}`;
    lines.push(header);
    lines.push(p.text.trim());
    lines.push('');
  }

  return lines.join('\n');
}
