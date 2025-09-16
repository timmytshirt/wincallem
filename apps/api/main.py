from fastapi import FastAPI

app = FastAPI(title="WinCallem API")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
