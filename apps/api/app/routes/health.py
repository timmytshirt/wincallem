import time

from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"ok": True, "timestamp": time.time()}
