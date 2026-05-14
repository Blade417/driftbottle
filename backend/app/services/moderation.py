"""内容审核 —— 当前仅做敏感词过滤。

设计取舍:
- 用最朴素的子串匹配,小词表(几百条以内)。性能足够,Python str in 是 C 实现。
- 不做拼音/变体规避对抗(用 z h 这种)。等真有滥用样本再说,过度设计反伤体验。
- 词表分类只是为了后续日志归类方便,匹配逻辑不区分。

补词建议: 真上线后从被管理员"下架"的内容里反向提炼。
"""
from __future__ import annotations

_POLITICAL = {
    "习近平", "毛泽东", "六四", "天安门事件", "法轮功",
    "台独", "藏独", "疆独", "港独", "反共", "反华",
}

_PORN = {
    "黄片", "色情", "性交", "做爱", "约炮", "援交", "包养",
    "卖淫", "嫖娼", "鸡巴", "肛交", "口交", "自慰",
    "fuck", "porn", "sex", "xxx",
}

_VIOLENCE = {
    "杀人", "自杀", "自残", "炸弹", "爆炸", "恐怖袭击",
}

_ADS = {
    "微信", "vx", "weixin", "扫码", "加群", "代刷", "刷单", "兼职日结",
    "高薪招聘", "网赚", "棋牌", "博彩", "彩票", "赌球",
}

_BLOCKED: frozenset[str] = frozenset(
    w.lower() for w in (_POLITICAL | _PORN | _VIOLENCE | _ADS)
)


class ModerationError(ValueError):
    """内容审核未通过。路由层应当映射为 400。"""


def find_blocked_word(content: str) -> str | None:
    """返回第一个命中的词；没有命中返回 None。"""
    if not content:
        return None
    haystack = content.lower()
    for w in _BLOCKED:
        if w in haystack:
            return w
    return None


def assert_clean(content: str) -> None:
    """命中即抛 ModerationError, 上层路由会转 400。"""
    hit = find_blocked_word(content)
    if hit:
        raise ModerationError("内容包含违禁词，请修改后再发送")
