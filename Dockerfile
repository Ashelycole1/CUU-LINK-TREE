# One image serves the API (/api/v1) and the web app (/, /:username) on the same origin.
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --include=dev && npm run build:web

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app /app
EXPOSE 8080
CMD ["npm", "run", "start:prod"]
