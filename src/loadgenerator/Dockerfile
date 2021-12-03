FROM locustio/locust:latest
COPY locustfile.py .
COPY data.py .
ENTRYPOINT locust --headless --host=http://${FRONTEND_ADDR}

