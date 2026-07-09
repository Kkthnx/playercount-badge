FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
  && corepack prepare pnpm@10.12.1 --activate

WORKDIR /workspace

CMD ["sh", "-c", "pnpm install && pnpm run build"]
