# Эврика: builds the site and runs the account/progress server that also serves it.
# docker build -t evrika . && docker run -p 8787:8787 -v evrika-data:/data evrika
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=8787 DATA_FILE=/data/users.json
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server/index.ts"]
