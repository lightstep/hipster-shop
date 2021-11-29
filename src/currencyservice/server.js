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
const tracer = require('./tracer')(process.env.LS_SERVICE_NAME);
const api = require('@opentelemetry/api');
const PORT = process.env.PORT;

/**
 * Starts an RPC server that receives requests for the
 * CurrencyConverter service at the sample server port
 */
function main () {
  const path = require('path');
  const grpc = require('grpc');
  const pino = require('pino');
  const logger = pino({
    name: 'currencyservice-server',
    messageKey: 'message',
    changeLevelName: 'severity',
    useLevelLabels: true
  });
  logger.info(`Starting gRPC server on port ${PORT}...`);

  const protoLoader = require('@grpc/proto-loader');

  const MAIN_PROTO_PATH = path.join(__dirname, './proto/demo.proto');
  const HEALTH_PROTO_PATH = path.join(__dirname, './proto/grpc/health/v1/health.proto');

  const shopProto = _loadProto(MAIN_PROTO_PATH).hipstershop;
  const healthProto = _loadProto(HEALTH_PROTO_PATH).grpc.health.v1;

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
  function _getCurrencyData (callback) {
    const span = tracer.startSpan("_getCurrencyData")
    const data = require('./data/currency_conversion.json');
    span.end()
    callback(data);
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
    const span = tracer.startSpan("getSupportedCurrencies")
    span.setAttribute('vendor.error_id', '17343337');
    try {
      api.context.with(api.trace.setSpan(api.context.active(), span), () => _getCurrencyData((data) => {
        callback(null, {currency_codes: Object.keys(data)});
      }));
    }
    finally {
      span.end();
    }
  }

  /**
   * Converts between currencies
   */
  function convert (call, callback) {
    logger.info('received conversion request');
    const span = tracer.startSpan("convert");
    try {
      api.context.with(api.trace.setSpan(api.context.active(), span), () => {
        try {
          _getCurrencyData((data) => {
            const request = call.request;
            // Convert: from_currency --> EUR
            const from = request.from;
            const euros = _carry({
              units: from.units / data[from.currency_code],
              nanos: from.nanos / data[from.currency_code]
            });
            span.setAttribute('currency_code.from', from.currency_code)
            span.setAttribute('currency_code.to', request.to_code)

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
            span.addEvent('conversion request successful')
            callback(null, result);
          });
        } catch (err) {
          logger.error(`conversion request failed: ${err}`);
          span.setAttribute('error', true);
          span.addEvent(`conversion request failed: ${err}`, {
            'error.object': err,
            message: err.message,
            stack: err.stack
          });
          callback(err.message);
        }
      });
    } finally {
      span.end();
    }
  }

  /**
   * Endpoint for health checks
   */
  function check (call, callback) {
    callback(null, { status: 'SERVING' });
  }

  const server = new grpc.Server();
  server.addService(shopProto.CurrencyService.service, {getSupportedCurrencies, convert});
  server.addService(healthProto.Health.service, {check});
  server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
