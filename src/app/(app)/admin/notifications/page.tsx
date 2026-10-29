import { redirect } from "next/navigation";
import { AdminNotifications } from "@/components/admin-notifications";
import { getTelegramConfig, TEMPLATE_COLUMNS, type NotificationTemplate } from "@shared/notify";
import { getT } from "@/lib/i18n/server";
import { isOwner, pageUser } from "@/lib/server/session";
import { adminDb } from "@/lib/server/supabase";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Bildirishnomalar boshqaruvi") };
}

export default async function AdminNotificationsPage() {
  const user = await pageUser();
  if (!isOwner(user)) redirect("/matches");
  const db = adminDb();
  const [tpl, cfg, sent, linked] = await Promise.all([
    db.from("notification_templates").select(TEMPLATE_COLUMNS).order("category").order("sort"),
    getTelegramConfig(db),
    db.from("notifications").select("id, user_id, template_key, title, telegram_status, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(40),
    db.from("telegram_accounts").select("user_id", { count: "exact", head: true }),
  ]);
  const ids = [...new Set((sent.data ?? []).map((n) => n.user_id))];
  const { data: people } = ids.length ? await db.from("steam_accounts").select("user_id, persona_name").in("user_id", ids) : { data: [] };
  const names = Object.fromEntries((people ?? []).map((p) => [p.user_id, p.persona_name]));

  return (
    <AdminNotifications
      templates={(tpl.data ?? []) as NotificationTemplate[]}
      bot={cfg ? { username: cfg.username } : null}
      linkedCount={linked.count ?? 0}
      sentCount={sent.count ?? 0}
      sent={(sent.data ?? []).map((n) => ({ id: n.id, title: (n.title as { uz?: string })?.uz ?? "", key: n.template_key, who: names[n.user_id] ?? "—", telegram: n.telegram_status, at: n.created_at }))}
    />
  );
}
