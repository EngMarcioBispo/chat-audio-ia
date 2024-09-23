# Usar a imagem base do Nginx
FROM nginx:latest

# Copia os arquivos do certificado para o contêiner (opcional)
COPY certificados/server.crt /etc/ssl/certs/server.crt
COPY certificados/server.key /etc/ssl/private/server.key

# Copia os arquivos HTML para o diretório padrão do Nginx
COPY html/ /usr/share/nginx/html/

# Copia o arquivo de configuração customizado para o Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80 para HTTP e 443 para HTTPS (opcional)
EXPOSE 80
EXPOSE 443
