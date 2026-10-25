import cluster from 'node:cluster';
import os from 'node:os';
import path from 'node:path';
import { Logger } from '@nestjs/common';

const logger = new Logger('ClusterManager');

function getWorkerCount(): number {
  if (process.env.WORKERS) {
    const custom = parseInt(process.env.WORKERS, 10);
    if (!isNaN(custom) && custom > 0) return custom;
  }
  return typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
}

if (cluster.isPrimary) {
  const workerCount = getWorkerCount();
  logger.log(`⚡ Primary cluster manager [PID ${process.pid}] initialized`);
  logger.log(
    `⚡ Vertical CPU scaling active: Spawning ${workerCount} worker process(es) across available CPU cores`,
  );

  cluster.setupPrimary({
    exec: path.join(__dirname, 'main.js'),
  });

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.log(`✓ Worker [PID ${worker.process.pid}] is online and listening`);
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      `⚠️ Worker [PID ${worker.process.pid}] exited (code: ${code}, signal: ${signal}). Auto-recovering worker...`,
    );
    cluster.fork();
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    logger.log(
      `Received ${signal}. Gracefully disconnecting all cluster workers...`,
    );
    for (const id in cluster.workers) {
      cluster.workers[id]?.process.kill();
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
