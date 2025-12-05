FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
  ffmpeg \
  poppler-utils \
  libreoffice \
  fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "start"]