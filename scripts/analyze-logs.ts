#!/usr/bin/env npx ts-node
import * as fs from 'fs'
import * as path from 'path'

interface SecurityEvent {
  type: string
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ip: string
  userAgent?: string
  userId?: string
  status?: string
  details?: Record<string, unknown>
}

const LOGS_DIR = path.join(__dirname, '../logs')
const SECURITY_LOG = path.join(LOGS_DIR, 'security.log')

function parseLogFile(): SecurityEvent[] {
  if (!fs.existsSync(SECURITY_LOG)) {
    console.log('No security log file found at:', SECURITY_LOG)
    return []
  }

  const content = fs.readFileSync(SECURITY_LOG, 'utf-8')
  const events: SecurityEvent[] = []

  const jsonObjects = content.split('\n\n').filter(block => block.trim())

  for (const block of jsonObjects) {
    try {
      const event = JSON.parse(block) as SecurityEvent
      events.push(event)
    } catch {
      // Skip malformed entries
    }
  }

  return events
}

function countByType(events: SecurityEvent[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function countBySeverity(events: SecurityEvent[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function getFailedLogins(events: SecurityEvent[]): SecurityEvent[] {
  return events.filter(e =>
    e.type === 'FAILED_LOGIN' ||
    (e.type === 'LOGIN_FAILURE' || e.type === 'LOGIN_ATTEMPT' && e.status === 'FAILED')
  )
}

function getHighSeverityEvents(events: SecurityEvent[]): SecurityEvent[] {
  return events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL')
}

function getSuspiciousIPs(events: SecurityEvent[], threshold: number = 5): Record<string, number> {
  const ipCounts: Record<string, number> = {}
  const suspiciousEvents = events.filter(e =>
    e.type.includes('FAILED') ||
    e.type.includes('ERROR') ||
    e.severity === 'HIGH' ||
    e.severity === 'CRITICAL'
  )

  for (const event of suspiciousEvents) {
    ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1
  }

  return Object.fromEntries(
    Object.entries(ipCounts).filter(([_, count]) => count >= threshold)
  )
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return timestamp
  }
}

function printReport(events: SecurityEvent[]): void {
  console.log('\n' + '='.repeat(60))
  console.log('SECURITY LOG ANALYSIS REPORT')
  console.log('='.repeat(60))
  console.log(`\nTotal events analyzed: ${events.length}`)

  if (events.length === 0) {
    console.log('\nNo events to analyze.')
    return
  }

  console.log('\n--- Events by Type ---')
  const byType = countByType(events)
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`)
  }

  console.log('\n--- Events by Severity ---')
  const bySeverity = countBySeverity(events)
  for (const severity of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
    const count = bySeverity[severity] || 0
    const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🟢'
    console.log(`  ${icon} ${severity}: ${count}`)
  }

  const failedLogins = getFailedLogins(events)
  if (failedLogins.length > 0) {
    console.log(`\n--- Failed Login Attempts: ${failedLogins.length} ---`)
    const recentFailed = failedLogins.slice(-10)
    for (const event of recentFailed) {
      console.log(`  ${formatTimestamp(event.timestamp)} - IP: ${event.ip}`)
    }
  }

  const highSeverity = getHighSeverityEvents(events)
  if (highSeverity.length > 0) {
    console.log(`\n--- High/Critical Severity Events: ${highSeverity.length} ---`)
    for (const event of highSeverity.slice(-10)) {
      console.log(`  [${event.severity}] ${event.type} - ${formatTimestamp(event.timestamp)} - IP: ${event.ip}`)
    }
  }

  const suspiciousIPs = getSuspiciousIPs(events)
  const suspiciousCount = Object.keys(suspiciousIPs).length
  if (suspiciousCount > 0) {
    console.log(`\n--- Suspicious IPs (5+ suspicious events): ${suspiciousCount} ---`)
    for (const [ip, count] of Object.entries(suspiciousIPs).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${ip}: ${count} suspicious events`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Security Log Analyzer

Usage: npx ts-node scripts/analyze-logs.ts [options]

Options:
  -h, --help     Show this help message
  --json         Output as JSON
  --failed       Show only failed login attempts
  --severity     Show events by severity breakdown

Examples:
  npx ts-node scripts/analyze-logs.ts
  npx ts-node scripts/analyze-logs.ts --json
  npx ts-node scripts/analyze-logs.ts --failed
`)
    process.exit(0)
  }

  const events = parseLogFile()

  if (args.includes('--json')) {
    console.log(JSON.stringify({
      total: events.length,
      byType: countByType(events),
      bySeverity: countBySeverity(events),
      failedLogins: getFailedLogins(events),
      highSeverity: getHighSeverityEvents(events),
      suspiciousIPs: getSuspiciousIPs(events),
    }, null, 2))
    return
  }

  if (args.includes('--failed')) {
    const failed = getFailedLogins(events)
    console.log(`\nFailed Login Attempts: ${failed.length}\n`)
    for (const event of failed) {
      console.log(`${formatTimestamp(event.timestamp)} - IP: ${event.ip} - UserAgent: ${event.userAgent || 'unknown'}`)
    }
    return
  }

  if (args.includes('--severity')) {
    const bySeverity = countBySeverity(events)
    console.log('\nEvents by Severity:')
    for (const severity of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
      console.log(`  ${severity}: ${bySeverity[severity] || 0}`)
    }
    return
  }

  printReport(events)
}

main()