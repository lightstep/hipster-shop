FROM python:2.7-slim
RUN apt-get update -qqy && \
	apt-get -qqy install wget g++ && \
	rm -rf /var/lib/apt/lists/*
# show python logs as they occur
ENV PYTHONUNBUFFERED=0

ENV DD_TRACE_AGENT_URL=https://ingest.lightstep.com:443
ENV DD_TRACE_GLOBAL_TAGS="lightstep.service_name:recommendationservices,lightstep.access_token:Wfhecs+qnaOncJb5L8PHCuo98pnddVhtayxCtQ0lV7vZuzz7EptplEe/yTeO5E4ZBGBSg3oOcstlbeZ/nlZ2lc8lNd3z3/+35ZoXGeZQ"

# download the grpc health probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.2.0 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# get packages
WORKDIR /recommendationservice
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install ls-trace

# add files into working directory
COPY . .

# set listen port
ENV PORT "8080"
EXPOSE 8080

ENTRYPOINT ["ls-trace-run", "python", "/recommendationservice/recommendation_server.py"]
