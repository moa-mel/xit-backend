

FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM node:22-alpine AS production
ENV TZ=Africa/Lagos
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install --omit=dev --ignore-scripts

COPY --from=build /usr/src/app/dist ./dist

# ✅ Prisma runs AFTER Render injects DATABASE_URL
CMD ["sh", "-c", "npx prisma generate && node dist/src/main.js"]

