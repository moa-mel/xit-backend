# Build stage
FROM node:22-alpine as build
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine as production
ENV TZ=Africa/Lagos
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts

# Generate Prisma client (will use DATABASE_URL from environment)
RUN npx prisma generate

# Copy built files from build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]