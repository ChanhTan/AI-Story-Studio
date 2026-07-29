import asyncio
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from config import settings
from routers.api import router as api_router
from routers.ws import router as ws_router
from utils.logger import logger

app = FastAPI(
    title="AI Story Video Creator",
    description="Generate cinematic story videos automatically with AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)

static_dirs = {
    "/images": settings.images_folder,
    "/audio": settings.audio_folder,
    "/videos": settings.videos_folder,
    "/output": settings.output_folder,
}

for url_path, dir_path in static_dirs.items():
    if Path(dir_path).exists():
        app.mount(url_path, StaticFiles(directory=dir_path), name=url_path.lstrip("/"))


@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("AI Story Video Creator starting...")
    logger.info(f"Backend: http://{settings.host}:{settings.port}")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown():
    from services.image_service import image_generator
    await image_generator.close()
    logger.info("Server shutdown complete")


@app.get("/")
async def root():
    return {
        "app": "AI Story Video Creator",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
