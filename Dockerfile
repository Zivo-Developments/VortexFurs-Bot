FROM node:current-slim
WORKDIR /app
COPY . .
RUN yarn install
CMD ["yarn", "prod"]