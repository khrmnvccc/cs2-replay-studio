import type { SupabaseClient } from "@supabase/supabase-js";
import os from "node:os";
import type { Config } from "./config";
import { CAPABILITY_FOR_JOB, JOB_TYPES, type JobType } from "../../shared/jobs";
import { PermanentError } from "./lib/errors";

export interface Job {
  id: string;
  user_id: string;
  type: JobType;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export interface JobContext {
  db: SupabaseClient;
  config: Config;
  job: Job;
  progress: (pct: number, message?: string) => Promise<void>;
}

export type JobHandler = (ctx: JobContext) => Promise<Record<string, unknown> | void>;
/** Yakuniy xatoda chaqiriladi (masalan clip yoki demo statusini 'failed' qilish) */
export type FailureHook = (ctx: JobContext, error: string) => Promise<void>;

export class Queue {
  private stopping = false;
  constructor(
    private db: SupabaseClient,
    private config: Config,
    private handlers: Partial<Record<JobType, JobHandler>>,
    private onFinalFailure: Partial<Record<JobType, FailureHook>> = {},
  ) {}

  get types(): JobType[] {
    return JOB_TYPES.filter((t) => this.handlers[t] && this.config.capabilities.has(CAPABILITY_FOR_JOB[t]));
  }

  async heartbeat() {
    await this.db.from("workers").upsert({
      id: this.config.WORKER_ID,
      capabilities: [...this.config.capabilities],
      hostname: os.hostname(),
      version: this.config.WORKER_EXIT_WHEN_IDLE ? "scheduled" : "1.0.0",
      last_seen_at: new Date().toISOString(),
    });
  }

  stop() {
    this.stopping = true;
  }

  async runLoop(slot: number, types: JobType[]) {
    const deadline = this.config.WORKER_MAX_MINUTES ? Date.now() + this.config.WORKER_MAX_MINUTES * 60_000 : Infinity;
    while (!this.stopping && Date.now() < deadline) {
      let job: Job | null = null;
      try {
        const { data, error } = await this.db.rpc("claim_job", { p_worker_id: `${this.config.WORKER_ID}#${slot}`, p_types: types });
        if (error) throw new Error(error.message);
        job = (data as Job[] | null)?.[0] ?? null;
      } catch (e) {
        console.error("[queue] claim xatosi:", (e as Error).message);
      }
      if (!job) {
        if (this.config.WORKER_EXIT_WHEN_IDLE) return;
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      await this.execute(job);
    }
  }

  private async execute(job: Job) {
    const started = Date.now();
    console.log(`[job] ${job.type} ${job.id} (urinish ${job.attempts}/${job.max_attempts})`);
    const beat = setInterval(() => {
      void this.db.from("processing_jobs").update({ heartbeat_at: new Date().toISOString() }).eq("id", job.id);
    }, 15_000);
    const ctx: JobContext = {
      db: this.db,
      config: this.config,
      job,
      progress: async (pct, message) => {
        await this.db
          .from("processing_jobs")
          .update({ progress: Math.max(0, Math.min(100, Math.round(pct))), progress_message: message ?? null, heartbeat_at: new Date().toISOString() })
          .eq("id", job.id);
      },
    };
    try {
      const result = await this.handlers[job.type]!(ctx);
      await this.db
        .from("processing_jobs")
        .update({ status: "succeeded", progress: 100, result: result ?? {}, locked_by: null, error: null })
        .eq("id", job.id);
      console.log(`[job] ${job.type} ${job.id} OK (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).slice(0, 1000);
      const permanent = e instanceof PermanentError;
      const retry = !permanent && job.attempts < job.max_attempts;
      console.error(`[job] ${job.type} ${job.id} XATO${retry ? " (qayta urinadi)" : ""}: ${msg}`);
      await this.db
        .from("processing_jobs")
        .update({
          status: retry ? "queued" : "failed",
          error: msg,
          locked_by: null,
          progress_message: retry ? "Xato — qayta urinish navbatda" : null,
          run_after: new Date(Date.now() + 30_000 * 2 ** (job.attempts - 1)).toISOString(),
        })
        .eq("id", job.id);
      if (!retry) await this.onFinalFailure[job.type]?.(ctx, msg).catch(() => undefined);
    } finally {
      clearInterval(beat);
    }
  }
}
