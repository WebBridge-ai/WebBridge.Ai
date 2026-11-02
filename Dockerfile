# Serves only the website; hero-animation/ and the docs stay out of the image.
FROM nginx:stable-alpine

COPY index.html sk.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
