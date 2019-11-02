import { Apis as TraQ } from 'traq-api'
import { randomString, pkce, hmacsha1 } from './utils'

export const baseURL =
  process.env.VUE_APP_API_ENDPOINT || 'https://traq-dev.tokyotech.org/api/1.0'

export let traq = new TraQ({
  basePath: baseURL
})
let token = ''

export function setAuthToken (token_) {
  traq = new TraQ({
    basePath: baseURL,
    accessToken: token_
  })
  token = token_
}

export async function redirectAuthorizationEndpoint () {
  const state = randomString(10)
  const codeVerifier = randomString(43)
  const codeChallenge = await pkce(codeVerifier)

  sessionStorage.setItem(`login-code-verifier-${state}`, codeVerifier)

  const authorizationEndpointUrl = new URL(`${baseURL}/oauth2/authorize`)
  authorizationEndpointUrl.search = new URLSearchParams({
    client_id:
      process.env.VUE_APP_API_CLIENT_ID ||
      'lkElAHAUIqFmImUvxmWItnbWO7EBdxttwBaW',
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  })
  window.location.assign(authorizationEndpointUrl)
}

export function fetchAuthToken (code, verifier) {
  return traq.postOauth2Token(
    'authorization_code',
    code,
    undefined,
    process.env.VUE_APP_API_CLIENT_ID || 'lkElAHAUIqFmImUvxmWItnbWO7EBdxttwBaW',
    verifier
  )
}

export function getUserIconURL (name) {
  return `${baseURL}/public/icon/${encodeURIComponent(name)}`
}

export function getWebhookMessages (id) {
  return traq.axios.get(`${baseURL}/webhooks/${id}/messages`, {
    params: { limit: 10 },
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function postWebhookMessage (id, message, secret = '') {
  const signature = secret !== '' ? await hmacsha1(message, secret) : undefined
  return traq.postWebhook(id, message, undefined, signature)
}

export async function getBots () {
  return traq.getBots({
    params: {
      all: 1
    }
  })
}

export async function getBotEventLogs (botId, limit, offset) {
  return traq.axios.get(`${baseURL}/bots/${botId}/events/logs`, {
    params: { limit, offset },
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
