FROM atendai/evolution-api:latest

# Ejecuta como root para instalar Chromium y dependencias necesarias
USER root

RUN apk update \
    && apk add --no-cache --virtual .build-deps \
       ca-certificates \
    && apk add --no-cache \
       chromium \
       nss \
       freetype \
       harfbuzz \
       ttf-freefont \
       fontconfig \
    && ln -sf /usr/bin/chromium /usr/bin/chromium-browser || true \
    && rm -rf /var/cache/apk/*

# Indica a Puppeteer / Baileys que use el binario del sistema y que no descargue Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser

# Mantener el usuario por defecto del contenedor base (no forzamos usuario)
