import humanizeDuration from "humanize-duration";

export function timeToWord(date: number | string | Date): string {
  const startDate = new Date(date);
  const endDate = new Date();
  const diff = endDate.getTime() - startDate.getTime();
  const shortened: string = humanizeDuration(diff, {
    round: true,
  });
  return shortened;
}
