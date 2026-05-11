"""基于 wxauto 的 Windows 桌面端微信适配器 (主窗口轮询模式)

原理：
- 通过 wxauto.WeChat() 连接到 PC 微信主窗口
- 定期切换到目标会话 (ChatWith) 并读取最新消息 (GetAllMessage)
- 通过与上一轮结果对比，识别"新消息"进行处理
- 和独立小窗监听模式相比，对窗口焦点要求更低，更稳定

依赖: 本地 wxauto 包 (已由 pip 或源码复制到项目目录)
要求:
  - Windows + Python 3.9-3.13
  - PC 微信 3.9.11.17 版本
  - 微信主窗口保持可见，不要最小化到托盘
"""
from __future__ import annotations

import threading
import time
from typing import Callable, Dict, List, Optional

from loguru import logger

from .base import ChatAdapter, IncomingMessage


class WxAutoAdapter(ChatAdapter):
    def __init__(
        self,
        listen_contacts: List[str],
        group_reply_only_at_me: bool = True,
        poll_interval: float = 1.5,
    ):
        self.listen_contacts = listen_contacts
        self.group_reply_only_at_me = group_reply_only_at_me
        self.poll_interval = poll_interval

        self._wx = None
        self._self_name: str = ""
        self._stop_flag = threading.Event()
        self._thread: Optional[threading.Thread] = None

        # 每个会话上次见过的最后一条消息标识 (用 sender + content 粗略去重)
        # key: chat_name, value: set[str] of "sender|content"
        self._seen: Dict[str, set] = {}
        # 每个会话是否做过首次快照 (首次进入时把已有历史全部标记为"已见"，避免一启动就把历史全回一遍)
        self._primed: Dict[str, bool] = {}

    # ------------------------------------------------------------------
    # 初始化
    # ------------------------------------------------------------------
    def _init_wx(self) -> None:
        try:
            from wxauto import WeChat  # type: ignore
        except ImportError as e:
            raise RuntimeError(
                "未安装 wxauto，请在 Windows 上执行: pip install wxauto\n"
                "或把 cluic/wxauto 的 wxauto 源码文件夹放到项目根目录。"
            ) from e

        self._wx = WeChat()
        try:
            self._self_name = getattr(self._wx, "nickname", "") or ""
        except Exception:
            self._self_name = ""
        logger.info("已连接到 PC 微信，当前账号昵称: {}", self._self_name or "<未知>")
        logger.info("监听模式: 主窗口轮询 (每 {}s 切换并扫描一次)", self.poll_interval)
        if self.listen_contacts:
            logger.info("目标会话: {}", self.listen_contacts)

    # ------------------------------------------------------------------
    # 启动 / 停止
    # ------------------------------------------------------------------
    def start(self, on_message: Callable[[IncomingMessage], None]) -> None:
        self._init_wx()

        def loop() -> None:
            logger.info("开始轮询微信消息...")
            while not self._stop_flag.is_set():
                for name in self.listen_contacts:
                    if self._stop_flag.is_set():
                        break
                    try:
                        self._scan_chat(name, on_message)
                    except Exception as e:
                        logger.exception("扫描会话 {} 出错: {}", name, e)
                # 一轮结束后休眠
                self._stop_flag.wait(self.poll_interval)

        self._thread = threading.Thread(target=loop, daemon=True, name="wxauto-loop")
        self._thread.start()

    def stop(self) -> None:
        self._stop_flag.set()
        if self._thread:
            self._thread.join(timeout=3)
        logger.info("wxauto 适配器已停止")

    # ------------------------------------------------------------------
    # 核心：扫描一个会话
    # ------------------------------------------------------------------
    def _scan_chat(
        self,
        chat_name: str,
        on_message: Callable[[IncomingMessage], None],
    ) -> None:
        assert self._wx is not None
        # 切换到这个会话 (相当于在微信主窗口左侧点击该联系人)
        try:
            self._wx.ChatWith(chat_name)
        except Exception as e:
            logger.debug("ChatWith({}) 失败，跳过本轮: {}", chat_name, e)
            return

        # 读取当前聊天窗口的所有消息 (默认取最近的几十条)
        try:
            msgs = self._wx.GetAllMessage()
        except Exception as e:
            logger.debug("GetAllMessage() 失败: {}", e)
            return

        if not msgs:
            return

        seen_set = self._seen.setdefault(chat_name, set())

        # 首次进入时，把所有已有消息标记为"已见"，避免把历史消息当作新消息回复
        if not self._primed.get(chat_name, False):
            for m in msgs:
                seen_set.add(self._msg_key(m))
            self._primed[chat_name] = True
            logger.debug("会话 {} 首次加载，快照 {} 条历史消息", chat_name, len(msgs))
            return

        # 找出新消息 (按顺序处理，保持对话顺序)
        new_msgs = []
        for m in msgs:
            key = self._msg_key(m)
            if key in seen_set:
                continue
            seen_set.add(key)
            new_msgs.append(m)

        # 控制 seen_set 大小，防止无限增长
        if len(seen_set) > 2000:
            # 只保留最近的 1000 条
            self._seen[chat_name] = set(list(seen_set)[-1000:])

        for m in new_msgs:
            parsed = self._parse_message(chat_name, m)
            if parsed is None:
                continue
            try:
                on_message(parsed)
            except Exception as e:
                logger.exception("处理消息回调出错: {}", e)

    @staticmethod
    def _msg_key(m) -> str:
        sender = getattr(m, "sender", "") or ""
        content = getattr(m, "content", "") or ""
        mtype = getattr(m, "type", "") or ""
        # 同一发送人 + 同一内容 + 同一类型 视为同一条
        return f"{mtype}|{sender}|{content}"

    # ------------------------------------------------------------------
    # 消息解析
    # ------------------------------------------------------------------
    def _parse_message(self, chat_name: str, m) -> Optional[IncomingMessage]:
        """把 wxauto 原始消息对象转为 IncomingMessage."""
        mtype = getattr(m, "type", "") or ""
        sender = getattr(m, "sender", "") or ""
        content = getattr(m, "content", "") or ""

        # 过滤掉自己发的消息 (wxauto 里 type="self")
        if mtype == "self":
            return None
        # 过滤系统消息 (如 "xx 撤回了一条消息", "以下为新消息" 等)
        if mtype in ("sys", "time"):
            return None
        if not content:
            return None

        # 群聊判断：
        # - 私聊中 wxauto 的 sender 通常等于 chat_name (联系人昵称)
        # - 群聊中 sender 是群成员名，chat_name 是群名，两者不同
        # - "文件传输助手" 这种特殊会话，sender 也会是 "文件传输助手"，不算群聊
        is_group = sender != chat_name and sender != "" and sender != "SYS"

        # 是否 @ 了自己
        is_at_me = False
        if is_group and self._self_name:
            is_at_me = f"@{self._self_name}" in content

        return IncomingMessage(
            chat_name=chat_name,
            sender=sender or chat_name,
            content=content,
            is_group=is_group,
            is_at_me=is_at_me,
            msg_type="text",
        )

    # ------------------------------------------------------------------
    # 发送
    # ------------------------------------------------------------------
    def send_text(
        self,
        chat_name: str,
        text: str,
        at_user: Optional[str] = None,
    ) -> None:
        if self._wx is None:
            logger.warning("wx 尚未初始化，无法发送")
            return
        try:
            if at_user:
                self._wx.SendMsg(msg=text, who=chat_name, at=at_user)
            else:
                self._wx.SendMsg(msg=text, who=chat_name)
            # 把自己刚发的消息也加入"已见"集合，避免下一轮扫描把自己发的当成新消息
            key_self = f"self||{text}"
            self._seen.setdefault(chat_name, set()).add(key_self)
            logger.info("已发送到 [{}]: {}", chat_name, text)
        except Exception as e:
            logger.exception("发送消息失败: {}", e)
