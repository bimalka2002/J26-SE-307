FROM python:3.12-slim-bookworm@sha256:34386ef0cb081344d7ec1c103ba398e6e9f64e9ab3a1509accc92a4e24a07258

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=300 \
    PIP_RETRIES=5 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    PORT=8000

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

RUN useradd --uid 10001 --user-group --create-home appuser
COPY --chown=10001:10001 main.py model_registry.py preprocessing.py prediction.py verify_models.py ./
COPY --chown=10001:10001 saved_models/ ./saved_models/
RUN python verify_models.py

USER 10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ['PORT'] + '/ready', timeout=3)" || exit 1

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port \"$PORT\" --workers 1"]
