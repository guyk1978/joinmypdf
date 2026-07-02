/** Gate for the private site inventory page and admin nav link. */
export function isAdminInventoryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_INVENTORY === "true";
}
