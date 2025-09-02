import time
from celery_app import celery

@celery.task(name="tasks.train_demo_model")
def train_demo_model(model_name: str, params: dict):
    # Simulate work
    time.sleep(2)
    # Toy "metrics"
    metrics = {
        "model": model_name,
        "params": params,
        "auc": 0.61,
        "accuracy": 0.58,
        "examples": 12345,
    }
    return metrics
