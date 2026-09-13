FROM golang:1.27.1-bookworm AS go-build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd cmd
COPY internal internal
RUN CGO_ENABLED=0 go build -trimpath -o /server ./cmd/server

FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PYTHON_BIN=/usr/local/bin/python PLAYWRIGHT_BROWSERS_PATH=/ms-playwright PORT=8080 LIVE_ENABLED=false
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir --require-hashes -r requirements.lock && python -m playwright install --with-deps chromium && useradd --create-home --uid 10001 portfolio
COPY --from=go-build /server /app/bin/server
COPY agent agent
RUN chown -R portfolio:portfolio /app /ms-playwright
USER portfolio
EXPOSE 8080
CMD ["/app/bin/server"]
