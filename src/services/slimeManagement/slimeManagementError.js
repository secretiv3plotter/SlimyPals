export class SlimeManagementError extends Error {
  constructor(ruleResult) {
    super(ruleResult.message)
    this.name = 'SlimeManagementError'
    this.reason = ruleResult.reason
  }
}

export function assertRule(ruleResult) {
  if (!ruleResult.allowed) {
    throw new SlimeManagementError(ruleResult)
  }
}
