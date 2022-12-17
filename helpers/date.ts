export function getDate(date: Date | number | string = new Date()) {
  try {
    date = new Date(date);
    if (!date.getTime()) {
      date = new Date();
    }
  } catch {
    date = new Date();
  }
  return new Date(date)
    .toLocaleDateString("en-UK", { timeZone: "Asia/Hong_Kong" })
    .split("/")
    .reverse()
    .join("-");
}

export function getTime(date: Date | number | string = new Date()) {
  try {
    date = new Date(date);
    if (!date.getTime()) {
      date = new Date();
    }
  } catch {
    date = new Date();
  }
  return new Date(date)
    .toLocaleTimeString("en-UK", {
      timeZone: "Asia/Hong_Kong",
    })
    .split(":")
    .filter((_v, i) => i < 2)
    .join(":");
}
