const {
  claimNext,
  markSent,
  markFailed,
  markRetryOrFailed,
  activeGameCount,
} = require('../services/outboundQueue');

const TICK_MS = 2000;
const zohoWindow = [];
let timer = null;
let ticking = false;

function isPrimaryWorker() {
  const instance = process.env.NODE_APP_INSTANCE;
  return instance == null || instance === '' || instance === '0';
}

function zohoBudgetRemaining() {
  const max = parseInt(process.env.ZOHO_JOBS_PER_MINUTE || '30', 10);
  const now = Date.now();
  while (zohoWindow.length && now - zohoWindow[0] > 60 * 1000) zohoWindow.shift();
  return Math.max(0, max - zohoWindow.length);
}

function noteZohoJob() {
  zohoWindow.push(Date.now());
}

function busyThreshold() {
  return parseInt(process.env.OUTBOUND_BUSY_ACTIVE_GAMES || '200', 10);
}

function jobErrorMessage(err) {
  return (err && err.message) ? String(err.message).slice(0, 500) : 'Unknown error';
}

async function executeJob(job) {
  if (job.kind === 'zoho') {
    const { executeJob: executeZohoJob } = require('../services/zohoService');
    await executeZohoJob(job.job_name, job.payload || {});
    return;
  }
  if (job.kind === 'email') {
    const { executeEmailJob } = require('../utils/emailService');
    await executeEmailJob(job.job_name, job.payload || {}, job);
    return;
  }
  throw new Error(`Unknown outbound kind: ${job.kind}`);
}

async function processOne(filters) {
  const job = await claimNext(filters);
  if (!job) return false;
  try {
    await executeJob(job);
    await markSent(job.id);
    if (job.kind === 'zoho') noteZohoJob();
  } catch (err) {
    if (err && err.permanent) {
      await markFailed(job.id, jobErrorMessage(err), (job.attempts || 0) + 1);
      console.error(`Outbound ${job.kind}/${job.job_name} failed permanently:`, err.message);
      return true;
    }
    const result = await markRetryOrFailed(job, jobErrorMessage(err));
    console.error(
      `Outbound ${job.kind}/${job.job_name} ${result.status} (attempt ${result.attempts}):`,
      err.message
    );
  }
  return true;
}

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const busy = (await activeGameCount()) >= busyThreshold();
    if (zohoBudgetRemaining() > 0) {
      await processOne({ kind: 'zoho' });
    }
    if (busy) {
      await processOne({ kind: 'email', maxPriority: 20 });
    } else {
      await processOne({ kind: 'email' });
    }
  } catch (err) {
    console.error('Outbound worker tick failed:', err.message);
  } finally {
    ticking = false;
  }
}

function startOutboundWorker() {
  if (process.env.OUTBOUND_WORKER === 'false') return;
  if (process.env.NODE_ENV === 'test') return;
  if (!isPrimaryWorker()) return;
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  timer.unref();
  console.log('Outbound worker started (Zoho + email retries)');
  tick().catch((err) => console.error('Outbound worker first tick failed:', err.message));
}

function stopOutboundWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startOutboundWorker, stopOutboundWorker, tick };
