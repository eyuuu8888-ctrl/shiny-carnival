"""基于 wxauto 的 Windows 桌面端微信适配器

原理：wxauto 通过 UI Automation 控制 PC 版微信客户端，
      读取会话窗口的新消息，并模拟操作发送回复。

依赖: pip install wxauto  (仅 Windows)
要求: 在 Windows 上必须先打开 PC 微信并登录，且**窗口不能被最小化到托盘**。
"""
from __future__ import annotations

import threading
import time
from typing import Callable, List, Optional

from loguru import logger

from .base import ChatAdapter, IncomingMessage


class WxAutoAdapter(ChatAdapter):
    def __init__(
        self,
        listen_contacts: List[str],
        group_reply_only_at_me: bool = True,
        poll_interval: float = 1.0,
    ):
        self.listen_contacts = listen_contacts
        self.group_reply_only_at_me = group_reply_only_at_me
        self.poll_interval = poll_interval

        self._wx = None
        self._self_name: str = ""
        self._stop_flag = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def _init_wx(self) -> None:
        # 优先使用 wxautox (V2 新版，由 wxauto 原作者 cluic 维护)，
        # 找不到时回退到旧版 wxauto。两者 API 基本兼容。
        try:
            from wxautox import WeChat  # type: ignore
            logger.info("使用 wxautox (V2) 作为微信适配后端")
        except ImportError:
            try:
                from wxauto import WeChat  # type: ignore
                logger.info("使用 wxauto (V1) 作为微信适配后端")
            except ImportError as e:
                raise RuntimeError(
                    "未安装微信适配库，请在 Windows + Python 3.12 下执行:\n"
                    "    pip install wxautox\n"
                    "或者:\n"
                    "    pip install wxauto"
                ) from e

        self._wx = WeChat()
        try:
            # 不同 wxauto 版本字段可能不同，尽量兼容
            self._self_name = getattr(self._wx, "nickname", "") or ""
        except Exception:
            self._self_name = ""
        logger.info("已连接到 PC 微信，当前账号昵称: {}", self._self_name or "<未知>")

        # 把需要监听的会话加入 wxauto 的监听列表
        for name in self.listen_contacts:
            try:
                self._wx.AddListenChat(who=name, savepic=False)
                logger.info("添加监听会话: {}", name)
            except Exception as e:
                logger.warning("添加监听会话 {} 失败: {}", name, e)

    def start(self, on_message: Callable[[IncomingMessage], None]) -> None:
        self._init_wx()

        def loop() -> None:
            logger.info("开始轮询微信消息 (间隔 {}s)", self.poll_interval)
            while not self._stop_flag.is_set():
                try:
                    msgs = self._wx.GetListenMessage()  # type: ignore[union-attr]
                except Exception as e:
                    logger.exception("读取消息失败: {}", e)
                    time.sleep(self.poll_interval)
                    continue

                # msgs: Dict[ChatWnd, List[Msg]]
                if msgs:
                    for chat, messages in msgs.items():
                        chat_name = getattr(chat, "who", None) or str(chat)
                        for m in messages:
                            parsed = self._parse_message(chat_name, m)
                            if parsed is None:
                                continue
                            try:
                                on_message(parsed)
                            except Exception as e:
                                logger.exception("处理消息回调出错: {}", e)

                time.sleep(self.poll_interval)

        self._thread = threading.Thread(target=loop, daemon=True, name="wxauto-loop")
        self._thread.start()

    def _parse_message(self, chat_name: str, m) -> Optional[IncomingMessage]:
        """把 wxauto 原始消息对象转为 IncomingMessage."""
        # wxauto Msg 通常有 type / sender / content 等属性
        mtype = getattr(m, "type", "")
        sender = getattr(m, "sender", "") or ""
        content = getattr(m, "content", "") or ""

        # type 为 "self" 表示自己发的，不处理
        if mtype == "self":
            return None
        # 只处理朋友/群友发的文本消息 (type="friend")
        if mtype not in ("friend", "sys", ""):
            return None
        # 系统消息直接忽略
        if mtype == "sys":
            return None
        if not content:
            return None

        # 群聊判断：wxauto 中群聊消息的 sender != chat_name
        is_group = sender != chat_name and sender != ""
        # 是否 @ 自己：检查内容里是否包含 @昵称
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

    def send_text(self, chat_name: str, text: str, at_user: Optional[str] = None) -> None:
        if self._wx is None:
            logger.warning("wx 尚未初始化，无法发送")
            return
        try:
            if at_user:
                # 群里 @ 某人
                self._wx.SendMsg(msg=text, who=chat_name, at=at_user)
            else:
                self._wx.SendMsg(msg=text, who=chat_name)
            logger.info("已发送到 [{}]: {}", chat_name, text)
        except Exception as e:
            logger.exception("发送消息失败: {}", e)

    def stop(self) -> None:
        self._stop_flag.set()
        if self._thread:
            self._thread.join(timeout=3)
        logger.info("wxauto 适配器已停止")
