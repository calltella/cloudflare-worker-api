FROM node:22-bookworm

# Debian/Ubuntuベースのイメージなので apt-get を使用
RUN apt-get update && \
    apt-get install -y git curl sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Debian/Ubuntuではsudoグループが標準で存在
RUN usermod -aG sudo node \
 && echo "%sudo ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/nopasswd \
 && chmod 0440 /etc/sudoers.d/nopasswd

 # 開発用Dockerコンテナなので割り切って書き込み可にする
RUN mkdir -p /app && chown node:node /app && chmod 777 /app

WORKDIR /app

# カレントディレクトリの内容を /app にコピー
COPY --chown=node:node . .

USER node

#EXPOSE 8787

# コンテナ作成（手動作成）
# docker build -t cloudflare-worker-api .
# docker network create --driver bridge --subnet 192.168.10.64/27 --gateway 192.168.10.65 docker_vercel_network
# docker run -d --name cloudflare-worker-api --network docker_vercel_network cloudflare-worker-api tail -f /dev/null
# docker run -d -v node_modules_cwa:/app/node_modules --name cloudflare-worker-api --network docker_vercel_network cloudflare-worker-api tail -f /dev/null
