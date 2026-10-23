FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package.json ./
COPY src ./src
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
