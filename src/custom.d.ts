import { MetricsLogger } from "aws-embedded-metrics";

declare global {
  namespace Express {
    interface Request {
      _startAt?: [number, number];
      metrics: MetricsLogger;
    }
  }
}
