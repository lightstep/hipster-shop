FROM golang:1.14-alpine AS builder

ENV PROJECT github.com/lightstep/hipster-shop/src/productcatalogservice
WORKDIR /go/src/$PROJECT

COPY . .
RUN go get -d -v
RUN go build -o /productcatalogservice .

FROM alpine AS release
RUN apk add --no-cache ca-certificates
RUN GRPC_HEALTH_PROBE_VERSION=v0.3.6 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe
WORKDIR /productcatalogservice
COPY --from=builder /productcatalogservice ./server
COPY products.json .
EXPOSE 3550
ENTRYPOINT ["/productcatalogservice/server"]

