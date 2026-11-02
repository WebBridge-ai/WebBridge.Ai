# Serves only the website; hero-animation/ and the docs stay out of the image.
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY 404.html 404-sk.html /usr/share/nginx/errors/
COPY index.html sk.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
COPY fingerprint.sh /tmp/
RUN sh /tmp/fingerprint.sh && rm /tmp/fingerprint.sh

EXPOSE 80
