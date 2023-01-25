export interface Command {
  isDependent: boolean;
  commandType: "admin" | "info" | "plugin";
  name: string;
  command: string;
  description?: string;
  public?: boolean;
}
