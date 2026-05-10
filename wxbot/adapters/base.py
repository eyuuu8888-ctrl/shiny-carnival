"""微信适配器抽象层

定义一套与具体协议无关的接口，方便替换底层实现。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Optional


@dataclass
class IncomingMessage:
    """一条收到的消息."""
    chat_name: str        # 会话名 (联系人昵称或群名)
    sender: str           # 发送者 (群聊中是群成员名，私聊中等于 chat_name)
    content: str          # 文本内容
    is_group: bool        # 是否群聊
    is_at_me: bool        # 是否 @ 了自己 (仅群聊有意义)
    msg_type: str = "text"  # 消息类型: text / image / voice / ...


class ChatAdapter(ABC):
    """微信适配器基类."""

    @abstractmethod
    def start(self, on_message: Callable[[IncomingMessage], None]) -> None:
        """启动监听，收到消息时调用 on_message 回调."""

    @abstractmethod
    def send_text(self, chat_name: str, text: str, at_user: Optional[str] = None) -> None:
        """给指定会话发送文本消息，可选 @ 某人 (群聊)."""

    @abstractmethod
    def stop(self) -> None:
        """停止监听."""
