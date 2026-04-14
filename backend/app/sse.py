from collections.abc import AsyncIterator
from typing import TypeVar

T = TypeVar("T")

async def single_item_stream(item: T) -> AsyncIterator[T]:
    yield item
