FROM node:20-slim

COPY package*.json ./

RUN npm ci

COPY src/ ./
COPY prisma/ ./
COPY tsconfig.json ./

RUN apt-get update -y && apt-get install -y openssl && \
    npx prisma generate && \
    npm run build && \
    npm prune --production

EXPOSE 8080

CMD [ "npm", "start" ]
