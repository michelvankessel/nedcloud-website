export const securityConfig = {
  rateLimit: {
    windowMs: 60 * 1000,
    apiMaxRequests: 100,
    authMaxRequests: 10,
  },
  
  validation: {
    titleMaxLength: 200,
    descriptionMaxLength: 500,
    contentMaxLength: 10000,
    postContentMaxLength: 100000,
    passwordMinLength: 8,
    passwordMaxLength: 100,
    nameMaxLength: 100,
    emailMaxLength: 200,
    urlMaxLength: 500,
    tagMaxLength: 50,
    maxTags: 20,
    maxFeatures: 20,
    maxTechnologies: 30,
  },
  
  headers: {
    hstsMaxAge: 63072000,
    hstsIncludeSubDomains: true,
    hstsPreload: true,
  },
  
  session: {
    passwordHashRounds: 12,
  },
} as const

export type SecurityConfig = typeof securityConfig