FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
ARG DATABASE_URL="mysql://user:password@localhost:3306/seven_board"
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_OPTIONS=--stack_size=8192
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
