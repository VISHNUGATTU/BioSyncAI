FROM python:3.11-slim

WORKDIR /app

# Install lightweight Linux runtime libraries (under 2MB, avoids LLVM memory exhaustion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies and ensure headless OpenCV is enforced (no X11/Qt GUI bindings)
RUN pip install --no-cache-dir --default-timeout=120 -r requirements.txt \
    && pip uninstall -y opencv-python opencv-python-headless 2>/dev/null || true \
    && pip install --no-cache-dir --force-reinstall opencv-python-headless>=4.8.0

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

