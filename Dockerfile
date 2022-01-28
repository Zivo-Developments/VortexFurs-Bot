FROM node:17.4-slim
WORKDIR /app
COPY . .
RUN yarn install
CMD ["yarn", "prod"]