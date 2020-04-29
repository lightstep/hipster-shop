// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const VERSION = require('./package.json').version;

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
        service_name: 'paymentservice',
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

const charge = require('./charge');

const logger = pino({
  name: 'paymentservice-server',
  messageKey: 'message',
  changeLevelName: 'severity',
  useLevelLabels: true
});

class HipsterShopServer {
  constructor(protoRoot, port = HipsterShopServer.PORT) {
    this.port = port;

    this.packages = {
      hipsterShop: this.loadProto(path.join(protoRoot, 'demo.proto')),
      health: this.loadProto(path.join(protoRoot, 'grpc/health/v1/health.proto'))
    };

    this.server = new grpc.Server();
    this.loadAllProtos(protoRoot);
  }

  /**
   * Handler for PaymentService.Charge.
   * @param {*} call  { ChargeRequest }
   * @param {*} callback  fn(err, ChargeResponse)
   */
  static ChargeServiceHandler(call, callback) {
    const parentSpan = tracer.scope().active();
    const span = tracer.startSpan('ChargeServiceHandler', { childOf: parentSpan });
    try {
      logger.info(`PaymentService#Charge invoked with request ${JSON.stringify(call.request)}`);
      const response = charge(call.request);
      callback(null, response);
      span.finish();
    } catch (err) {
      console.warn(err);
      span.setTag('error', true);
      span.log({
        event: `conversion request failed: ${err}`,
        'error.object': err,
        message: err.message,
        stack: err.stack
      });
      callback(err);
      span.finish();
    }
  }

  static CheckHandler(call, callback) {
    callback(null, { status: 'SERVING' });
  }

  listen() {
    this.server.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure());
    logger.info(`PaymentService grpc server listening on ${this.port}`);
    this.server.start();
  }

  loadProto(path) {
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

  loadAllProtos(protoRoot) {
    const hipsterShopPackage = this.packages.hipsterShop.hipstershop;
    const healthPackage = this.packages.health.grpc.health.v1;

    this.server.addService(
      hipsterShopPackage.PaymentService.service,
      {
        charge: HipsterShopServer.ChargeServiceHandler.bind(this)
      }
    );

    this.server.addService(
      healthPackage.Health.service,
      {
        check: HipsterShopServer.CheckHandler.bind(this)
      }
    );
  }
}

HipsterShopServer.PORT = process.env.PORT;

module.exports = HipsterShopServer;
