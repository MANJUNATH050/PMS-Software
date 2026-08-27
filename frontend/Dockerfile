<<<<<<< HEAD
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
=======
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
