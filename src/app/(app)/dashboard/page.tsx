import { redirect } from "next/navigation";

// Eski havolalar uchun: bosh sahifa endi Matchlar
export default function Dashboard() {
  redirect("/matches");
}
