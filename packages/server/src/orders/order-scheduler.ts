import type { FastifyBaseLogger, FastifyInstance } from "fastify";

import type { JobResult, OrdersService } from "./orders.service.ts";

const MS_PER_SECOND = 1000;

export type IntervalJob = {
  start(): void;
  stop(): Promise<void>;
};

export function createIntervalJob(
  run: () => Promise<void>,
  intervalMs: number,
  onError: (error: unknown) => void,
): IntervalJob {
  let timer: ReturnType<typeof setInterval> | undefined;
  let running: Promise<void> | undefined;

  const tick = () => {
    if (running !== undefined) {
      return;
    }

    running = run()
      .catch(onError)
      .finally(() => {
        running = undefined;
      });
  };

  return {
    start() {
      timer ??= setInterval(tick, intervalMs);
    },
    async stop() {
      clearInterval(timer);
      timer = undefined;
      await running;
    },
  };
}

function report(log: FastifyBaseLogger, job: string, result: JobResult): void {
  for (const failure of result.failures) {
    log.error({ err: failure.error, orderId: failure.orderId }, `${job} failed for an order`);
  }

  if (result.processed > 0) {
    log.info({ processed: result.processed }, `${job} finished`);
  }
}

export function registerOrderScheduler(
  app: FastifyInstance,
  service: Pick<OrdersService, "expireUnpaid" | "closeElapsed">,
  intervalSeconds: number,
): void {
  const job = createIntervalJob(
    async () => {
      report(app.log, "expireUnpaid", await service.expireUnpaid());
      report(app.log, "closeElapsed", await service.closeElapsed());
    },
    intervalSeconds * MS_PER_SECOND,
    (error) => app.log.error({ err: error }, "Order scheduler run failed"),
  );

  app.addHook("onReady", async () => job.start());
  app.addHook("onClose", async () => job.stop());
}
