FROM node:20-slim

COPY package*.json .

RUN npm ci

COPY src/ ./

RUN npx prisma generate && \
    npm run build && \
    npm prune --production

EXPOSE 8080

CMD [ "npm", "start" ]
