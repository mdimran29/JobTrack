FROM node:20-bookworm-slim

WORKDIR /app

# Required by the LaTeX-to-PDF resume export endpoint.
RUN apt-get update \
  && apt-get install -y --no-install-recommends texlive-latex-base texlive-latex-extra \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Run as the unprivileged user that ships with the node image; pdflatex only needs /tmp.
USER node

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
