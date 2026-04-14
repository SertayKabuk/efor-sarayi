from collections.abc import AsyncIterator
from typing import TypeVar

T = TypeVar("T")

async def stream(item: T) -> AsyncIterator[T]:
    yield item
