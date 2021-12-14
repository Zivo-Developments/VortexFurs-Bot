FROM node:17.0.1-slim
WORKDIR /app
COPY . .
RUN yarn install
CMD ["yarn", "prod"]