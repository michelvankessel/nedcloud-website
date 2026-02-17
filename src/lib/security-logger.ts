const fs = require('fs/promises')
const path = require('path')
const { fileURLToPath } = require('url')

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');
const securityLogPath = path.join(logsDir, 'security.log');

async function ensureLogsDirectory() {
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true, mode: 0o750 });
  }
}

async function executeLogSecurityEvent(event: {
  type: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  userId?: string;
  status?: string;
  details?: any;
}) {
  try {
    await ensureLogsDirectory();
    const eventString = JSON.stringify(event, null, 2) + '\n\n';
    await fs.appendFile(securityLogPath, eventString);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function executeLogLoginAttempt(ip: string, userAgent: string, isSuccess: boolean, userId?: string) {
  const timestamp = new Date();
  const severity = isSuccess ? 'LOW' as const : 'HIGH' as const;
  const event = {
    type: isSuccess ? 'SUCCESSFUL_LOGIN' : 'FAILED_LOGIN',
    timestamp,
    severity,
    ip,
    userAgent,
    userId,
    status: isSuccess ? 'SUCCESS' : 'FAILED'
  };
  executeLogSecurityEvent(event);
}

function executeLogPageVisit(ip: string, userAgent: string, path: string, userId?: string) {
  const timestamp = new Date();
  const event = {
    type: 'PAGE_VISIT',
    timestamp,
    severity: 'LOW' as const,
    ip,
    userAgent,
    userId,
    details: {
      path,
    }
  };
  executeLogSecurityEvent(event);
}

function executeLogFormSubmission(ip: string, userAgent: string, formName: string, data: any, userId?: string) {
  const timestamp = new Date();
  const event = {
    type: 'FORM_SUBMISSION',
    timestamp,
    severity: 'MEDIUM' as const,
    ip,
    userAgent,
    userId,
    details: {
      formName,
      data,
    }
  };
  executeLogSecurityEvent(event);
}

function executeLogAPIRequest(ip: string, userAgent: string, method: string, route: string, userId?: string, status?: number) {
  const timestamp = new Date();
  const event = {
    type: 'API_REQUEST',
    timestamp,
    severity: 'MEDIUM' as const,
    ip,
    userAgent,
    userId,
    details: {
      method,
      route,
      status,
    }
  };
  executeLogSecurityEvent(event);
}


export {
  executeLogSecurityEvent as logSecurityEvent,
  executeLogPageVisit as logPageVisit,
  executeLogFormSubmission as logFormSubmission,
  executeLogAPIRequest as logAPIRequest,
  executeLogLoginAttempt as logLoginAttempt
}
