FROM node:10
COPY package* ./
RUN npm ci
COPY . .
RUN npm run build
