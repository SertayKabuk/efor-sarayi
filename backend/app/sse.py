from collections.abc import AsyncIterator, Awaitable, Callable
from inspect import isawaitable
from typing import TypeVar

T = TypeVar("T")

async def single_item_stream(
    item_factory: Callable[[], T | Awaitable[T]],
) -> AsyncIterator[T]:
    item = item_factory()
    if isawaitable(item):
        item = await item
    yield item
