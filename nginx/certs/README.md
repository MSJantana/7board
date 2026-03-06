# SSL Certificates

To enable HTTPS, place your SSL certificate and private key in this directory.

1.  **fullchain.pem**: Your SSL certificate (including intermediate chain).
2.  **privkey.pem**: Your private key.

After placing the files, uncomment the SSL configuration blocks in `nginx/nginx.conf` and restart the Nginx container.

For local development, you can generate self-signed certificates using OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/certs/privkey.pem -out nginx/certs/fullchain.pem
```
