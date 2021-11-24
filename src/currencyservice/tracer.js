'use strict';

const opentelemetry = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor, ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } =  require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { B3Propagator, B3InjectEncoding } = require('@opentelemetry/propagator-b3');

opentelemetry.propagation.setGlobalPropagator(new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }))

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      }),
    }
  );
  registerInstrumentations({
    instrumentations: [ getNodeAutoInstrumentations() ],
  });
  opentelemetry.diag.setLogger(
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.DEBUG,
  );

  const exporter = new OTLPTraceExporter({
    url: `https://${process.env.LIGHTSTEP_HOST}/traces/otlp/v0.6`,
    headers: {
      'Lightstep-Access-Token': process.env.LS_ACCESS_TOKEN
    },
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter));

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();

  return opentelemetry.trace.getTracer(serviceName);
};