

export function parseTime(time:string) {
  const t = time.split(":");
  return parseInt(t[0], 10) * 3600 + parseInt(t[1], 10) * 60 + parseInt(t[2], 10) * 1;
}
