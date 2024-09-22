# Usando uma imagem base do Nginx
FROM nginx:latest

# Copia os arquivos HTML para o diretório padrão do Nginx
COPY html/ /usr/share/nginx/html/

# Expor a porta 80 para acessar o serviço
EXPOSE 80
