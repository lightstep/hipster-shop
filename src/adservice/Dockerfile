FROM openjdk:8-slim as builder

WORKDIR /app

ARG LS_ACCESS_TOKEN
ENV LS_ACCESS_TOKEN $LS_ACCESS_TOKEN

COPY ["build.gradle", "gradlew", "./"]
COPY gradle gradle
RUN chmod +x gradlew
RUN ./gradlew downloadRepos

COPY . .
RUN chmod +x gradlew
RUN ./gradlew installDist

FROM openjdk:8-slim

# Download Stackdriver Profiler Java agent
RUN apt-get -y update && apt-get install -qqy \
    wget \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/cprof && \
    wget -q -O- https://storage.googleapis.com/cloud-profiler/java/latest/profiler_java_agent.tar.gz \
    | tar xzv -C /opt/cprof && \
    rm -rf profiler_java_agent.tar.gz

RUN mkdir -p /opt/otel && \
	wget --quiet -O /opt/otel/opentelemetry-auto-0.2.0.jar \
	https://github.com/open-telemetry/opentelemetry-auto-instr-java/releases/download/v0.2.0/opentelemetry-auto-0.2.0.jar

RUN mkdir -p /opt/otel && \
	wget --quiet -O /opt/otel/opentelemetry-auto-exporters-jaeger-0.2.0.jar \
	https://github.com/open-telemetry/opentelemetry-auto-instr-java/releases/download/v0.2.0/opentelemetry-auto-exporters-jaeger-0.2.0.jar

RUN mkdir -p /opt/specialagent && \
    wget --quiet -O /opt/specialagent/opentracing-specialagent-1.6.0.jar \
    "https://repo1.maven.org/maven2/io/opentracing/contrib/specialagent/opentracing-specialagent/1.6.0/opentracing-specialagent-1.6.0.jar"

RUN GRPC_HEALTH_PROBE_VERSION=v0.2.1 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

WORKDIR /app
COPY --from=builder /app .

EXPOSE 9555
ENTRYPOINT ["/app/build/install/hipstershop/bin/AdService"]
