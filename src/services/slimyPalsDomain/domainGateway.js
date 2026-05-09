export {
  feedOwnedSlime,
  getFoodProductionAllowed,
  getMockFriendFeedResult,
  loadDomain,
  produceOwnedFood,
  refreshDailyTimers,
  removeOwnedSlime,
  summonOwnedSlime,
} from './localDomainGateway'

export { hydrateDomain } from './domainHydration'

export {
  feedRemoteFriendSlime,
  feedRemoteOwnedSlime,
  loadRemoteDomain,
  produceRemoteFood,
  removeRemoteOwnedSlime,
  summonRemoteSlime,
} from './remoteDomainGateway'
