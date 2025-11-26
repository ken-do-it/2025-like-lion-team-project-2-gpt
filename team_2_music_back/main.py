"""Development entry point for the music-sharing backend."""

from fastapi import FastAPI

from app.factory import create_app


app: FastAPI = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
