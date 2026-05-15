export function seededRandom(id, salt = '') {
  const str = String(id) + salt
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xfffffff
  }
  return hash / 0xfffffff
}

export function getSlimeMotionFrame(slimeMotionPath, progress, fallbackFace) {
  const segmentProgress = progress * slimeMotionPath.points.length
  const pointIndex = Math.floor(segmentProgress) % slimeMotionPath.points.length
  const nextPointIndex = (pointIndex + 1) % slimeMotionPath.points.length
  const progressBetweenPoints = segmentProgress - Math.floor(segmentProgress)
  const fromPoint = slimeMotionPath.points[pointIndex]
  const toPoint = slimeMotionPath.points[nextPointIndex]
  const point = interpolatePoint(
    fromPoint,
    toPoint,
    progressBetweenPoints,
  )

  return {
    face: getFaceForHorizontalMovement(toPoint.x - fromPoint.x, fallbackFace),
    point,
  }
}

function getFaceForHorizontalMovement(deltaX, fallbackFace) {
  if (Math.abs(deltaX) < 0.25) {
    return fallbackFace
  }

  return deltaX > 0 ? -1 : 1
}

function interpolatePoint(fromPoint, toPoint, progress) {
  return {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
  }
}
