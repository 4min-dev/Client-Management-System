export function getOptionsChangedEventKey(stationId: string): string {
  return `${stationId}-options-changed-event`;
}

export function getFuelsChangedEventKey(stationId: string): string {
  return `${stationId}-fuels-changed-event`;
}