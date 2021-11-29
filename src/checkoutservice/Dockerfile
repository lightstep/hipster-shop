FROM golang:1.14-alpine as builder

ENV PROJECT github.com/lightstep/hipster-shop/src/checkoutservice
WORKDIR /go/src/$PROJECT

COPY . .
RUN go get -d -v
RUN go build -gcflags='-N -l' -o /checkoutservice .

FROM alpine as release
RUN apk add --no-cache ca-certificates bash
RUN GRPC_HEALTH_PROBE_VERSION=v0.3.6 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe
COPY --from=builder /checkoutservice /checkoutservice
EXPOSE 5050

ENTRYPOINT ["/checkoutservice"]
