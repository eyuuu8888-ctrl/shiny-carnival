"""微信适配器模块

提供一套统一的 ChatAdapter 接口，未来可以接入 wxauto / wechaty / padlocal 等不同后端。
"""
from .base import ChatAdapter, IncomingMessage

__all__ = ["ChatAdapter", "IncomingMessage"]
