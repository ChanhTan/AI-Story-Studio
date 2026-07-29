import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from utils.logger import logger

router = APIRouter()

active_connections: list[WebSocket] = []


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info("WebSocket client connected")

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def broadcast_message(message: dict):
    dead = []
    for conn in active_connections:
        try:
            await conn.send_text(json.dumps(message))
        except Exception:
            dead.append(conn)
    for conn in dead:
        if conn in active_connections:
            active_connections.remove(conn)
