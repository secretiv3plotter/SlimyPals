export const API_ERROR_MESSAGES = Object.freeze({
  API_ERROR: 'Something went wrong.',
  AUTH_TOKEN_EXPIRED: 'Your session expired. Please log in again.',
  DAILY_SUMMON_LIMIT_REACHED: 'You have no daily summons left.',
  DOMAIN_CAPACITY_REACHED: 'Your yard is already full.',
  FEED_COOLDOWN_ACTIVE: 'This slime is not hungry yet.',
  FOOD_ALREADY_PRODUCED_TODAY: 'Your factory already produced food today.',
  FOOD_STOCK_FULL: 'Your food stock is full.',
  FRIEND_LIMIT_REACHED: 'Your friend list is full.',
  FRIEND_USER_NOT_FOUND: 'That user could not be found.',
  FRIENDSHIP_ALREADY_EXISTS: 'That friendship already exists.',
  FRIENDSHIP_UNAVAILABLE: 'That friend yard is unavailable.',
  INVALID_CREDENTIALS: 'Username or password is incorrect.',
  INVALID_JSON_RESPONSE: 'The server returned an invalid response.',
  NETWORK_ERROR: 'Unable to reach the Slimy Pals server.',
  NO_ACTIVE_SLIMES: 'You need at least one slime to produce food.',
  NO_FOOD_AVAILABLE: 'No slime food available.',
  RATE_LIMITED: 'Please slow down and try again shortly.',
  SLIME_ALREADY_ADULT: 'That slime is already fully grown.',
  SLIME_OWNER_MISMATCH: 'You cannot do that to this slime.',
  SLIME_UNAVAILABLE: 'That slime is unavailable.',
  USER_UNAVAILABLE: 'This user is unavailable.',
  USERNAME_TAKEN: 'That username is already taken.',
  VALIDATION_ERROR: 'Please check the submitted details.',
})

export function getApiErrorMessage(error, fallback = API_ERROR_MESSAGES.API_ERROR) {
  return API_ERROR_MESSAGES[error?.code] || error?.message || fallback
}
