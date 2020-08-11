FROM python:3.7.0-slim as builder

RUN apt-get update \ 
    && apt-get install g++ -y \
    && apt-get clean

COPY requirements.txt /app/requirements.txt

WORKDIR /app
RUN pip install --user -r requirements.txt
COPY . /app

# app image
FROM python:3.7.0-slim as app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app/locustfile.py /app/locustfile.py
COPY --from=builder /app/loadgen.sh /app/loadgen.sh

WORKDIR /app

RUN apt-get -qq update \ 
    && apt-get install -y --no-install-recommends curl

RUN chmod +x ./loadgen.sh

ENTRYPOINT ./loadgen.sh
