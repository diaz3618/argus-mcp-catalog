# Demo Dockerfile — illustrates the container.dockerfile co-location pattern.
# The paired YAML file references this Dockerfile by filename only (no path, no ..).
# Both files must be in the same directory.
# For a real server, replace these steps with genuine build instructions.
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir mcp
COPY . .
ENTRYPOINT ["python", "-m", "demo_server"]
