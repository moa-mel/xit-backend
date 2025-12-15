FROM node:22-alpine as build
WORKDIR /usr/src/app
ENV NODE_ENV=development 
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine as production
ENV TZ=Africa/Lagos
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ./package*.json ./
COPY ./prisma ./prisma
RUN npm install --omit=dev --ignore-scripts
RUN npx prisma generate 
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/src/main.js"]