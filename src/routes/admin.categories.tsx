import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, slugify, type Category } from "@/lib/apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery());
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase
      .from("application_categories")
      .insert({ name: name.trim(), slug: slugify(name), sort_order: cats.length + 1 });
    if (error) return void toast.error(error.message);
    setName("");
    toast.success("Category added");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Categories</h1>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}>Add</Button>
      </div>
      <div className="divide-y rounded-xl border bg-card">
        {cats.map((c) => <Row key={c.id} cat={c} />)}
      </div>
    </div>
  );
}

function Row({ cat }: { cat: Category }) {
  const qc = useQueryClient();
  const [name, setName] = useState(cat.name);
  const [order, setOrder] = useState(String(cat.sort_order));

  async function save() {
    const { error } = await supabase
      .from("application_categories")
      .update({ name, sort_order: Number(order) || 0 })
      .eq("id", cat.id);
    if (error) return void toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }
  async function remove() {
    if (!confirm(`Delete “${cat.name}”? Apps in it will have no category.`)) return;
    await supabase.from("applications").update({ category_id: null }).eq("category_id", cat.id);
    const { error } = await supabase.from("application_categories").delete().eq("id", cat.id);
    if (error) return void toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries();
  }

  return (
    <div className="flex items-center gap-2 p-3">
      <Input className="w-16" value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Order" />
      <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
      <Button size="icon" variant="ghost" onClick={save} aria-label="Save"><Save className="size-4" /></Button>
      <Button size="icon" variant="ghost" onClick={remove} aria-label="Delete"><Trash2 className="size-4" /></Button>
    </div>
  );
}
