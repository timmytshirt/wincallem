from fastapi import FastAPI

app = FastAPI(title="WinCallem API")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/odds/health")
def odds_health():
    return {"ok": True, "service": "odds"}
