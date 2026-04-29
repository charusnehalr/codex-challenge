import { redirect } from "next/navigation";

export default function MealsRedirectPage() {
  redirect("/app/meals");
}
