export function getDate() {
  return new Date()
    .toLocaleDateString("en-UK", { timeZone: "Asia/Hong_Kong" })
    .replaceAll("/", "-");
}
