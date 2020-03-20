FROM microsoft/dotnet:2.1-sdk-alpine as builder
WORKDIR /app
COPY . .
RUN dotnet restore && \
    dotnet build && \
    dotnet publish -c release -r linux-musl-x64 -o /cartservice

# cartservice
FROM alpine:3.8

RUN GRPC_HEALTH_PROBE_VERSION=v0.2.0 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# Dependencies for runtime
# busybox-extras => telnet
RUN apk add --no-cache \
    busybox-extras \
    libc6-compat \
    libunwind \
    libuuid \
    libgcc \
    libstdc++ \
    libintl \
    icu \
    openssl \
    curl \
    bash

RUN mkdir -p /opt/datadog && \
    curl -L \
       https://github.com/lightstep/ls-trace-dotnet/releases/download/v1.9.0/lightstep-dotnet-apm-1.9.0.tar.gz \
        -o /tmp/lightstep-dotnet-apm-1.9.0.tar.gz && \
    tar xzf /tmp/lightstep-dotnet-apm-1.9.0.tar.gz -C /opt/datadog

ENV CORECLR_ENABLE_PROFILING=1
ENV CORECLR_PROFILER={846F5F1C-F9AE-4B07-969E-05C26BC060D8}
ENV CORECLR_PROFILER_PATH=/opt/datadog/Datadog.Trace.ClrProfiler.Native.so
ENV DD_INTEGRATIONS=/opt/datadog/integrations.json
ENV DD_DOTNET_TRACER_HOME=/opt/datadog

WORKDIR /app
COPY --from=builder /cartservice .
ARG HIPSTER_HEALTH
ENV HIPSTER_HEALTH $HIPSTER_HEALTH
ENTRYPOINT ["./cartservice", "start"]
