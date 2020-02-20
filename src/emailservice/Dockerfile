FROM python:3.7-slim as base

FROM base as builder

RUN apt-get -qq update \
    && apt-get install -y --no-install-recommends \
        g++ \
    && rm -rf /var/lib/apt/lists/*

# get packages
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install ls-trace

FROM base as final
# Enable unbuffered logging
ENV PYTHONUNBUFFERED=1
# Enable Profiler
ENV ENABLE_PROFILER=1

ENV DD_TRACE_AGENT_URL=https://ingest.lightstep.com:443
ENV DD_TRACE_GLOBAL_TAGS="lightstep.service_name:emailservice,lightstep.access_token:Wfhecs+qnaOncJb5L8PHCuo98pnddVhtayxCtQ0lV7vZuzz7EptplEe/yTeO5E4ZBGBSg3oOcstlbeZ/nlZ2lc8lNd3z3/+35ZoXGeZQ"

RUN apt-get -qq update \
    && apt-get install -y --no-install-recommends \
        wget

# Download the grpc health probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.2.0 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

WORKDIR /email_server

# Grab packages from builder
COPY --from=builder /usr/local/lib/python3.7/ /usr/local/lib/python3.7/

# Add the application
COPY . .

EXPOSE 8080
ENTRYPOINT [ "ls-trace-run", "python", "email_server.py" ]
