import { authClient } from "@/lib/better-auth";

export async function getUserSettings() {

  const { data } = await authClient.getSession();
}
