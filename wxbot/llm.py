"""统一的 LLM 客户端

基于 OpenAI SDK 的兼容协议接入各大厂商：
- DeepSeek
- OpenAI
- 通义千问 (百炼 兼容模式)
- 任意符合 OpenAI Chat Completions 协议的服务
"""
from __future__ import annotations

from typing import List, Dict

from loguru import logger
from openai import OpenAI

from .config import LLMConfig


class LLMClient:
    def __init__(self, cfg: LLMConfig):
        self.cfg = cfg
        self.client = OpenAI(
            api_key=cfg.api_key,
            base_url=cfg.base_url,
        )
        logger.info(
            "LLM 已初始化: provider={} model={} base_url={}",
            cfg.provider,
            cfg.model,
            cfg.base_url,
        )

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """发送一次聊天请求，返回助手的回复文本."""
        try:
            resp = self.client.chat.completions.create(
                model=self.cfg.model,
                messages=messages,
                temperature=0.8,
                max_tokens=500,
            )
            content = (resp.choices[0].message.content or "").strip()
            return content
        except Exception as e:
            logger.exception("LLM 调用失败: {}", e)
            return ""
