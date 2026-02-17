import request from 'supertest'
import app from '@/app'

declare const app: any

it('should set CSP header without unsafe directives', async () => {
  const res = await request(app).get('/')
  const csp = res.headers['content-security-policy']
  expect(csp).toContain("default-src 'self'")
  expect(csp).not.toContain('unsafe-inline')
  expect(csp).not.toContain('unsafe-eval')
  
  expect(csp).toMatch(/style-src 'self'/)
})
