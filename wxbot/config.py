"""配置加载模块

统一从 .env 和 config.yaml 加载配置。
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

import yaml
from dotenv import load_dotenv


@dataclass
class LLMConfig:
    provider: str
    api_key: str
    base_url: str
    model: str


@dataclass
class BotConfig:
    system_prompt: str = "你是一个友好的微信助手。"
    memory_rounds: int = 10
    reply_delay_min: float = 1.0
    reply_delay_max: float = 4.0
    simulate_typing: bool = True


@dataclass
class ListenConfig:
    contacts: List[str] = field(default_factory=list)
    group_reply_only_at_me: bool = True


@dataclass
class FilterConfig:
    ignore_prefixes: List[str] = field(default_factory=list)
    ignore_non_text: bool = True


@dataclass
class AppConfig:
    llm: LLMConfig
    bot: BotConfig
    listen: ListenConfig
    filter: FilterConfig


def load_config(
    env_path: str | Path = ".env",
    yaml_path: str | Path = "config.yaml",
) -> AppConfig:
    """从 .env + config.yaml 加载完整配置."""
    # 1) 读取 .env (LLM 凭证放这里)
    env_file = Path(env_path)
    if env_file.exists():
        load_dotenv(env_file)
    else:
        raise FileNotFoundError(
            f"找不到 {env_file}，请复制 .env.example 为 .env 并填写 API Key"
        )

    llm = LLMConfig(
        provider=os.getenv("LLM_PROVIDER", "deepseek"),
        api_key=os.getenv("LLM_API_KEY", ""),
        base_url=os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1"),
        model=os.getenv("LLM_MODEL", "deepseek-chat"),
    )
    if not llm.api_key or llm.api_key.startswith("sk-xxx"):
        raise ValueError("请在 .env 中填写有效的 LLM_API_KEY")

    # 2) 读取 config.yaml (业务配置放这里)
    yaml_file = Path(yaml_path)
    if not yaml_file.exists():
        raise FileNotFoundError(
            f"找不到 {yaml_file}，请复制 config.yaml.example 为 config.yaml 并配置"
        )
    with yaml_file.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    bot = BotConfig(**(data.get("bot") or {}))
    listen = ListenConfig(**(data.get("listen") or {}))
    filter_cfg = FilterConfig(**(data.get("filter") or {}))

    return AppConfig(llm=llm, bot=bot, listen=listen, filter=filter_cfg)
