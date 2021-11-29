module github.com/lightstep/hipster-shop/src/frontend

go 1.14

require (
	github.com/golang/protobuf v1.4.3
	github.com/google/uuid v1.1.4
	github.com/gorilla/mux v1.8.0
	github.com/lightstep/otel-launcher-go v0.16.1
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.6.0
	go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux v0.16.0
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.16.0
	go.opentelemetry.io/otel v0.16.0
	golang.org/x/net v0.0.0-20210119194325-5f4716e94777
	google.golang.org/grpc v1.35.0
)
