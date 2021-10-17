# AWS CloudWatch Embedded Metrics Express Middleware

![CodeBuild](https://codebuild.eu-west-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiMmNlbFo0OW1QaXRNMWlkZ3lEdWRhN0RRaHpYYUhrNTVmTXRHOTFnNGRkV3JSZWtiYTNiL2h5TE15MXk3cmlXOFVVMDNTUzFSRWxucjhRcFRmTlJ3RXRvPSIsIml2UGFyYW1ldGVyU3BlYyI6IitFR0ZxSVlwREZZSmcyRUYiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main)
[![npm](https://img.shields.io/npm/v/aws-embedded-metrics-express.svg)](https://www.npmjs.com/package/aws-embedded-metrics-express)

This middleware for NodeJS [Express](http://expressjs.com/) framework hydrates `req.metrics` property with an instance of [MetricLogger](https://github.com/awslabs/aws-embedded-metrics-node#metriclogger). This instance can be used to easily generate custom metrics from your Express server without requiring custom batching code, making blocking network requests or relying on 3rd party software.

By default, the middleware will also automatically publish the following request metrics (See [Options](#options) for more metrics):

* `RequestDuration` in milliseconds.
* `StatusCodeXXX` for each response HTTP status code.
* `ClientError` if response HTTP status code starts with `4XX`.
* `ServerError` if response HTTP status code starts with `5XX`.

Metrics collected with this logger are then available for querying within [AWS CloudWatch Log Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)

You can explore all the MetricLogger APIs following [aws-embedded-metrics](https://github.com/awslabs/aws-embedded-metrics-node) documentation.

* [Installation](#installation)
* [Usage](#usage)
* [Options](#options)
* [Development](#development)

## Installation

```sh
npm install aws-embedded-metrics-express aws-embedded-metrics
```

## Usage

```js
// Configure your EMF metrics settings at the start as per https://github.com/awslabs/aws-embedded-metrics-node
const { Configuration, Unit } = require("aws-embedded-metrics");
Configuration.serviceName = "MyApp";
Configuration.serviceType = "NodeJSWebApp";
Configuration.logGroupName = "LogGroupName";
Configuration.namespace = "Namespace";

const { metricsMiddleware } = require("aws-embedded-metrics-express");
const express = require("express");

const app = express();

app.use(metricsMiddleware());

app.get("/", (req, res) => {
  // Add your own custom metrics like this
  req.metrics.putMetric("DatabaseRequestSuccess", 1, Unit.Count);
  res.send("Hello World!");
});

app.listen(3000);
```

## Options

You can supply options object to `metricsMiddleware` method: `app.use(metricsMiddleware({options));`

* `statusCodeMetric` (boolean) (optional): Defaults to `true`. Whether to publish metrics for each HTTP response status code. Metrics will appear in CloudWatch like e.g. 'StatusCode200'.
* `clientErrorMetric` (boolean) (optional): Defaults to `true`. Whether to publish `ClientError` metric based on response HTTP status code. (Useful if you want to calculate your availability metric)
* `serverErrorMetric` (boolean) (optional): Defaults to `true`. Whether to publish `ServerError` metric based on response HTTP status code. (Useful if you want to calculate your availability metric)
* `durationMetric` (boolean) (optional): Defaults to `true`. Whether to publish `RequestDuration` metric based on the time between the request coming into `metricsMiddleware` and when the response has finished being written out to the connection, in milliseconds.
* `ipProperty` (boolean) (optional): Defaults to `false`. Whether to set `RemoteAddress` property to EMF logs.
* `userAgentProperty` (boolean) (optional): Defaults to `false`. Whether to set `UserAgent` property to EMF logs.

## Development

### Building

This project uses [Volta](https://volta.sh/) to pin the currently supported version of node.

```sh
npm i && npm run build
```

### Testing

Unit tests which can be run using the following commands:

```sh
npm test
# or
npm run watch
```

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting.
You should install the plugin for your editor-of-choice and enabled format-on-save.

## License

This project is licensed under the Apache-2.0 License.
