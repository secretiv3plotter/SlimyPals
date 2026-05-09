export function toApiSyncAction(action) {
  return {
    clientActionId: action.id,
    type: action.type,
    payload: action.payload,
    createdAt: action.created_at,
  }
}

export function getActionResultId(result) {
  return result?.clientActionId || result?.id || result?.client_action_id
}

export function getActionResultStatus(result) {
  return result?.status || (result?.accepted ? 'accepted' : null)
}

export function getActionResultErrorCode(result) {
  return result?.error?.code || result?.errorCode || result?.error_code || null
}
