# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

# ---- runtime stage ----
FROM nginx:1.25-alpine

# remove the stock server block so nothing unexpected is loaded
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# full main config goes to the main config path — NOT conf.d/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
USER 101
CMD ["nginx", "-g", "daemon off;"]
