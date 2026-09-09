# Node 22+: @supabase/supabase-js braucht natives WebSocket, das Node 20 nicht hat.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
