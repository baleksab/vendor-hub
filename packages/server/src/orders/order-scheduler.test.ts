import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildTestApp } from "../testing/build-test-app.ts";
import { createIntervalJob, registerOrderScheduler } from "./order-scheduler.ts";

const INTERVAL_MS = 1000;

describe("createIntervalJob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs on every interval", async () => {
    const run = vi.fn(async () => {});
    const job = createIntervalJob(run, INTERVAL_MS, () => {});

    job.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(run).toHaveBeenCalledTimes(3);
    await job.stop();
  });

  it("skips a tick while the previous run is still going", async () => {
    let finish = () => {};
    const run = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const job = createIntervalJob(run, INTERVAL_MS, () => {});

    job.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(run).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(run).toHaveBeenCalledTimes(2);
    finish();
    await job.stop();
  });

  it("stops and reports errors", async () => {
    const onError = vi.fn();
    const run = vi.fn(async () => {
      throw new Error("boom");
    });
    const job = createIntervalJob(run, INTERVAL_MS, onError);

    job.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    await job.stop();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(run).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
  });

  it("starts on ready and stops on close when registered", async () => {
    const app = Fastify();
    const jobs = {
      expireUnpaid: vi.fn(async () => ({ processed: 0, failures: [] })),
      closeElapsed: vi.fn(async () => ({ processed: 0, failures: [] })),
    };

    registerOrderScheduler(app, jobs, 1);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(jobs.expireUnpaid).not.toHaveBeenCalled();

    await app.ready();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(jobs.expireUnpaid).toHaveBeenCalledTimes(1);
    expect(jobs.closeElapsed).toHaveBeenCalledTimes(1);

    await app.close();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(jobs.expireUnpaid).toHaveBeenCalledTimes(1);
  });
});

describe("buildTestApp", () => {
  it("does not start the scheduler", async () => {
    vi.useFakeTimers();

    const { app } = await buildTestApp();

    expect(vi.getTimerCount()).toBe(0);

    await app.close();
    vi.useRealTimers();
  });
});
