FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
ARG DATABASE_URL="mysql://user:password@localhost:3306/seven_board"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
