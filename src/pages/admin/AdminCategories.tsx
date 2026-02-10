import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name, description").order("name");
    setCategories(data ?? []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), description: newDesc.trim() });
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { setNewName(""); setNewDesc(""); fetchCategories(); }
  };

  const updateCategory = async () => {
    if (!editId || !editName.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editName.trim(), description: editDesc.trim() }).eq("id", editId);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { setEditId(null); fetchCategories(); }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else fetchCategories();
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">श्रेणी प्रबंधन</h1>
        <div className="flex gap-2">
          <Input placeholder="श्रेणी नाम" value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-[200px]" />
          <Input placeholder="विवरण" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="max-w-[300px]" />
          <Button onClick={addCategory}><Plus className="w-4 h-4 mr-1" /> जोड़ें</Button>
        </div>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाम</TableHead>
                <TableHead>विवरण</TableHead>
                <TableHead>कार्रवाई</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {editId === c.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                    ) : c.name}
                  </TableCell>
                  <TableCell>
                    {editId === c.id ? (
                      <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8" />
                    ) : (c.description || "—")}
                  </TableCell>
                  <TableCell>
                    {editId === c.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={updateCategory}><Save className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditId(c.id); setEditName(c.name); setEditDesc(c.description ?? ""); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCategories;
