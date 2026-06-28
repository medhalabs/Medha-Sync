FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

COPY package.json package-lock.json* ./
RUN npm install

COPY src/ ./src/

RUN mkdir -p sessions

EXPOSE 3001

CMD ["node", "src/index.js"]
