"use client";
import { useRouter } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import { useT } from "@/components/i18n";
import { Picker } from "@/components/ui/picker";

type Sort = "new" | "old" | "name";

/** Kliplar tartibi: tanlanishi bilan sahifa yangilanadi (alohida "Saralash" tugmasi shart emas). */
export function ClipSort({ value }: { value: Sort }) {
  const router = useRouter();
  const t = useT();
  return (
    <Picker<Sort>
      value={value}
      title={t("Saralash")}
      icon={<ArrowDownUp />}
      onChange={(v) => router.push(v === "new" ? "/clips" : `/clips?sort=${v}`, { scroll: false })}
      options={[
        { value: "new", label: t("Avval yangilari") },
        { value: "old", label: t("Avval eskilari") },
        { value: "name", label: t("Nomi bo'yicha") },
      ]}
    />
  );
}
