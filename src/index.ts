import { createMetricsLogger, Unit } from 'aws-embedded-metrics';
import { NextFunction, Request, Response } from 'express';
import * as onFinished from 'on-finished';

function getRequestDuration(req: Request): number | undefined {
  if (!req._startAt) {
    return;
  }

  const elapsed = process.hrtime(req._startAt);
  return (elapsed[0] * 1e3) + (elapsed[1] * 1e-6);
}

function getIp(req: Request): string | undefined {
  return req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    undefined;
}

export interface MetricsMiddlewareOptions {
  /**
   * Whether to publish metrics for each HTTP response status code.
   *
   * Metrics will appear in CloudWatch like e.g. 'StatusCode200'.
   *
   * @default true
   */
  statusCodeMetric?: boolean;

  /**
   * Whether to publish `ClientError` metric based on response HTTP status code.
   *
   * Useful if you want to calculate your availability metric.
   *
   * @default true
   */
  clientErrorMetric?: boolean;

  /**
   * Whether to publish `ServerError` metric based on response HTTP status code.
   *
   * Useful if you want to calculate your availability metric.
   *
   * @default true
   */
  serverErrorMetric?: boolean;

  /**
   * Whether to publish `RequestDuration` metric based on the time between the request
   * coming into `metricsMiddleware` and when the response
   * has finished being written out to the connection, in milliseconds.
   *
   * @default true
   */
  durationMetric?: boolean;

  /**
   * Whether to set `RemoteAddress` property to EMF logs.
   *
   * @default false
   */
  ipProperty?: boolean;

  /**
   * Whether to set `UserAgent` property to EMF logs.
   *
   * @default false
   */
  userAgentProperty?: boolean;
}

export const metricsMiddleware = (options: MetricsMiddlewareOptions = {}) => {
  const {
    statusCodeMetric = true,
    clientErrorMetric = true,
    serverErrorMetric = true,
    durationMetric = true,
    ipProperty = false,
    userAgentProperty = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (durationMetric) {
      req._startAt = process.hrtime();
    }

    req.metrics = createMetricsLogger();

    if (ipProperty) {
      req.metrics.setProperty('RemoteAddress', getIp(req));
    }

    if (userAgentProperty) {
      req.metrics.setProperty('UserAgent', req.headers['user-agent']);
    }

    onFinished(res, () => {
      const { metrics } = req;
      const { statusCode } = res;

      const duration = getRequestDuration(req);
      if (duration) {
        req.metrics.putMetric('RequestDuration', duration, Unit.Milliseconds);
      }

      if (statusCodeMetric) {
        metrics.putMetric(`StatusCode${statusCode}`, 1, Unit.Count);
      }
      if (clientErrorMetric) {
        metrics.putMetric('ClientError', statusCode >= 400 && statusCode < 500 ? 1 : 0, Unit.Count);
      }
      if (serverErrorMetric) {
        metrics.putMetric('ServerError', statusCode >= 500 ? 1 : 0, Unit.Count);
      }

      metrics.flush()
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .catch(() => { })
        .finally(() => next());
    });

    next();
  };
};
