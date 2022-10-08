export function getDate() {
  return new Date(
    new Date().toLocaleString("en", {
      timeZone: "Asia/Hong_Kong",
    })
  )
    .toISOString()
    .split("T")[0];
}
