/*
 * Copyright 2018 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const VERSION = require('./package.json').version;

require('@google-cloud/profiler').start({
  serviceContext: {
    service: 'currencyservice',
    version: '1.0.0'
  }
});
require('@google-cloud/trace-agent').start();
require('@google-cloud/debug-agent').start({
  serviceContext: {
    service: 'currencyservice',
    version: VERSION
  }
});

let scheme = process.env.LIGHTSTEP_PLAINTEXT == "true" ? 'http' : 'https';

const tracer = require('ls-trace').init({
    experimental: {
      b3: true
    },
    tags: {
      service: {
        version: VERSION
      },
      platform : require('os').platform(),
      lightstep: {
        service_name: 'currencyservice',
        access_token: process.env.LIGHTSTEP_ACCESS_TOKEN
      }
    },
    url: scheme + '://' + process.env.LIGHTSTEP_HOST,
    port: process.env.LIGHTSTEP_PORT
})

const opentracing = require('opentracing');
opentracing.initGlobalTracer(tracer);

const path = require('path');
const grpc = require('grpc');
const pino = require('pino');
const protoLoader = require('@grpc/proto-loader');

const MAIN_PROTO_PATH = path.join(__dirname, './proto/demo.proto');
const HEALTH_PROTO_PATH = path.join(__dirname, './proto/grpc/health/v1/health.proto');

const PORT = process.env.PORT;

const shopProto = _loadProto(MAIN_PROTO_PATH).hipstershop;
const healthProto = _loadProto(HEALTH_PROTO_PATH).grpc.health.v1;

const logger = pino({
  name: 'currencyservice-server',
  messageKey: 'message',
  changeLevelName: 'severity',
  useLevelLabels: true
});

/**
 * Helper function that loads a protobuf file.
 */
function _loadProto (path) {
  const packageDefinition = protoLoader.loadSync(
    path,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );
  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * Helper function that gets currency data from a stored JSON file
 * Uses public data from European Central Bank
 */
function _getCurrencyData (parentSpan, callback) {
  const span = parentSpan.tracer().startSpan('_getCurrencyData', { childOf : parentSpan });
  const data = require('./data/currency_conversion.json');
  callback(data);
  span.finish();
}

/**
 * Helper function that handles decimal/fractional carrying
 */
function _carry (amount) {
  const fractionSize = Math.pow(10, 9);
  amount.nanos += (amount.units % 1) * fractionSize;
  amount.units = Math.floor(amount.units) + Math.floor(amount.nanos / fractionSize);
  amount.nanos = amount.nanos % fractionSize;
  return amount;
}

/**
 * Lists the supported currencies
 */
function getSupportedCurrencies (call, callback) {
  const parentSpan = tracer.scope().active();
  const span = tracer.startSpan('getSupportedCurrencies', { childOf : parentSpan });
  logger.info('Getting supported currencies...');
  _getCurrencyData(span, (data) => {
    callback(null, {currency_codes: Object.keys(data)});
    span.finish();
  });
}

/**
 * Converts between currencies
 */
function convert (call, callback) {
  logger.info('received conversion request');
  const parentSpan = tracer.scope().active();
  const span = opentracing.globalTracer().startSpan('convert', { childOf : parentSpan });
  span.setTag('kind', 'server');
  
  try {
    _getCurrencyData(span, (data) => {
      const request = call.request;

      // Convert: from_currency --> EUR
      const from = request.from;
      const euros = _carry({
        units: from.units / data[from.currency_code],
        nanos: from.nanos / data[from.currency_code]
      });

      span.setTag('currency_code.from', from.currency_code);
      span.setTag('currency_code.to', request.to_code);

      euros.nanos = Math.round(euros.nanos);

      // Convert: EUR --> to_currency
      const result = _carry({
        units: euros.units * data[request.to_code],
        nanos: euros.nanos * data[request.to_code]
      });

      result.units = Math.floor(result.units);
      result.nanos = Math.floor(result.nanos);
      result.currency_code = request.to_code;

      logger.info(`conversion request successful`);
      span.log({ event: 'conversion request successful' })
      callback(null, result);
      span.finish()
    });
  } catch (err) {
    logger.error(`conversion request failed: ${err}`);
    span.setTag('error', true);
    span.log({ 
      event: `conversion request failed: ${err}`,
      'error.object': err, 
      message: err.message, 
      stack: err.stack 
    });
    callback(err.message);
    span.finish()
  }
}

/**
 * Endpoint for health checks
 */
function check (call, callback) {
  const parentSpan = tracer.scope().active();
  const span = opentracing.globalTracer().startSpan('health', { childOf : parentSpan });
  callback(null, { status: 'SERVING' });
  span.finish();
}

/**
 * Starts an RPC server that receives requests for the
 * CurrencyConverter service at the sample server port
 */
function main () {
  logger.info(`Starting gRPC server on port ${PORT}...`);
  const server = new grpc.Server();
  server.addService(shopProto.CurrencyService.service, {getSupportedCurrencies, convert});
  server.addService(healthProto.Health.service, {check});
  server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
