FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
COPY shared/package.json shared/package.json
COPY realtime/package.json realtime/package.json
RUN npm ci --workspace realtime --include=dev --ignore-scripts
COPY shared/src shared/src
COPY web/src/db/schema.ts web/src/db/schema.ts
COPY realtime realtime
RUN npm run build -w realtime
ENV NODE_ENV=production
ENV REALTIME_HOST=0.0.0.0
ENV REALTIME_PORT=4000
USER node
WORKDIR /app/realtime
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT || process.env.REALTIME_PORT) + '/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["../node_modules/.bin/tsx", "src/index.ts"]
