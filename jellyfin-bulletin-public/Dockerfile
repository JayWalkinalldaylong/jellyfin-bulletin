FROM node:20-alpine

WORKDIR /app

COPY server.js ./server.js
COPY public ./public
COPY jellyfin-bulletin-inject.js ./public/jellyfin-bulletin-inject.js

ENV PORT=80

EXPOSE 80

CMD ["node", "server.js"]
