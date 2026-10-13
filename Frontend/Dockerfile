# Estágio 1: Build da aplicação Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Estágio 2: Servidor Web para entregar o Frontend
FROM nginx:alpine
# Nota: O Angular costuma gerar os arquivos em dist/frontend/browser
COPY --from=build /app/dist/Frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]