import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "karigai · wellness intelligence" };

export default function RootPage() {
  redirect("/app/dashboard");
}
