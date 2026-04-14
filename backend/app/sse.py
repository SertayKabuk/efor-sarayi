from collections.abc import AsyncIterator, Awaitable, Callable
from inspect import isawaitable
from typing import TypeVar

T = TypeVar("T")

type SingleItemSource[T] = Callable[[], T | Awaitable[T]] | T | Awaitable[T]


async def single_item_stream(item_or_factory: SingleItemSource[T]) -> AsyncIterator[T]:
    item = item_or_factory() if callable(item_or_factory) else item_or_factory
    if isawaitable(item):
        item = await item
    yield item
