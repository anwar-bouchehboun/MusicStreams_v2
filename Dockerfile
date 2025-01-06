# Étape de build
FROM node:20-alpine as build
WORKDIR /app

# Installer npm@latest globalement
RUN npm install -g npm@latest

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances avec des options de base
RUN npm ci --prefer-offline --no-audit

# Copier le reste des fichiers
COPY . .
RUN npm run build
RUN ls -la dist/

# Étape de production
FROM nginx:alpine
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
