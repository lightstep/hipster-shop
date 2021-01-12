module github.com/lightstep/hipster-shop/checkoutservice

go 1.14

require (
	contrib.go.opencensus.io/exporter/stackdriver v0.5.0
	github.com/GoogleCloudPlatform/microservices-demo v0.1.4
	github.com/golang/protobuf v1.4.3
	github.com/google/uuid v1.1.2
	github.com/lightstep/otel-launcher-go v0.15.0
	github.com/sirupsen/logrus v1.6.0
	go.opencensus.io v0.22.5
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.15.1
	golang.org/x/net v0.0.0-20201031054903-ff519b6c9102
	google.golang.org/api v0.36.0 // indirect
	google.golang.org/grpc v1.34.0
)
