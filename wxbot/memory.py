"""对话上下文管理

每个联系人/群 维护一份独立的对话历史，按轮次滚动。
"""
from __future__ import annotations

from collections import deque
from typing import Dict, Deque, List


class ConversationMemory:
    """滚动窗口式的多会话记忆."""

    def __init__(self, system_prompt: str, max_rounds: int = 10):
        self.system_prompt = system_prompt
        # max_rounds 指保留最近 N 轮 (user + assistant) 对话
        self.max_messages = max_rounds * 2
        self._sessions: Dict[str, Deque[dict]] = {}

    def _get(self, session_id: str) -> Deque[dict]:
        if session_id not in self._sessions:
            self._sessions[session_id] = deque(maxlen=self.max_messages)
        return self._sessions[session_id]

    def append_user(self, session_id: str, text: str) -> None:
        self._get(session_id).append({"role": "user", "content": text})

    def append_assistant(self, session_id: str, text: str) -> None:
        self._get(session_id).append({"role": "assistant", "content": text})

    def build_messages(self, session_id: str) -> List[dict]:
        """构造发给 LLM 的 messages 列表 (含 system prompt)."""
        return [
            {"role": "system", "content": self.system_prompt},
            *list(self._get(session_id)),
        ]

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
