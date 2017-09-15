
export function parseFormat(data:string) {
  return data.match(/Format:(.*)/)[1].replace(/\s/g, "").split(",");
}
