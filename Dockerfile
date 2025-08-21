FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# Install build deps for optional native modules
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY . .

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["/bin/bash","/usr/src/app/docker-entrypoint.sh"]
