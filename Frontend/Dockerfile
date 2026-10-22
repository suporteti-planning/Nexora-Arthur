# Estágio 1: Build da aplicação Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Estágio 2: Servidor Web para entregar o Frontend
FROM nginx:alpine
# Copiar arquivos do build
COPY --from=build /app/dist/Frontend/browser /usr/share/nginx/html/browser
# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]