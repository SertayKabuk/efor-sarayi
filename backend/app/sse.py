import asyncio
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import suppress
from typing import Any, TypeVar

from fastapi import HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

T = TypeVar("T")

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


def client_wants_sse(request: Request) -> bool:
    return "text/event-stream" in request.headers.get("accept", "").lower()


def _format_sse(event: str, data: Any) -> bytes:
    payload = json.dumps(jsonable_encoder(data), ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


def sse_response(
    request: Request,
    handler: Callable[[], Awaitable[T]],
    *,
    start_message: str,
    heartbeat_interval: float = 5.0,
    status_code: int = 200,
) -> StreamingResponse:
    async def event_stream() -> AsyncIterator[bytes]:
        task = asyncio.create_task(handler())
        try:
            yield _format_sse("status", {"message": start_message})

            while True:
                if await request.is_disconnected():
                    task.cancel()
                    break

                try:
                    result = await asyncio.wait_for(
                        asyncio.shield(task),
                        timeout=heartbeat_interval,
                    )
                    yield _format_sse("result", result)
                    yield _format_sse("done", {"ok": True})
                    break
                except asyncio.TimeoutError:
                    yield _format_sse("heartbeat", {"message": start_message})
                except HTTPException as exc:
                    yield _format_sse(
                        "error",
                        {
                            "status_code": exc.status_code,
                            "detail": exc.detail,
                        },
                    )
                    break
                except Exception:
                    logger.exception("SSE request failed")
                    yield _format_sse(
                        "error",
                        {
                            "status_code": 500,
                            "detail": "Internal server error",
                        },
                    )
                    break
        finally:
            if not task.done():
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
        status_code=status_code,
    )
