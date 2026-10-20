# Linux worker: demo tahlili, match tarixi, Valve demo yuklash, GC, ZIP.
# (Render bu konteynerda ISHLAMAYDI — u Windows + CS2 talab qiladi.)
# Build kontekst — repo ildizi:  docker build -f worker/Dockerfile -t cs2-replay-worker .
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json ./
RUN npm ci --omit=dev && npm install --no-save tsx@4
COPY shared /app/shared
COPY src/lib/steam /app/src/lib/steam
COPY worker/src ./src
COPY worker/types ./types
COPY worker/tsconfig.json ./
ENV NODE_ENV=production WORK_DIR=/data
VOLUME /data
USER node
CMD ["npx", "tsx", "src/index.ts"]
