# Stage 1: Build the NestJS application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production environment
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production


COPY --from=builder /usr/src/app/dist ./dist

COPY .env ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
