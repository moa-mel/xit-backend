FROM node:22-alpine as build
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm install
COPY . .
# RUN npx prisma generate 
RUN npm run build

FROM node:22-alpine as production
ENV TZ=Africa/Lagos
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ./package*.json ./
COPY ./prisma ./prisma
RUN npm install --omit=dev --ignore-scripts
# This will use the DATABASE_URL from your Render environment variables
RUN npx prisma generate
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/src/main.js"]