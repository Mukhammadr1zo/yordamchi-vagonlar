"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUserAction, updateUserAction, deleteUserAction } from "@/lib/actions/user";
import { ROLE_LABELS } from "@/lib/auth/permissions";

type Row = {
  id: string;
  fullName: string;
  login: string;
  role: "SUPERADMIN" | "ADMIN" | "RAHBAR" | "VIEWER";
  isActive: boolean;
  lastLogin: string | null;
};

const selectCls =
  "border-input bg-transparent dark:bg-input/30 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function UsersManager({ users }: { users: Row[] }) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [pending, setPending] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPERADMIN" | "ADMIN" | "RAHBAR">("RAHBAR");
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setFullName("");
    setLogin("");
    setPassword("");
    setRole("RAHBAR");
    setIsActive(true);
    setOpen(true);
  }
  function openEdit(u: Row) {
    setEditing(u);
    setFullName(u.fullName);
    setLogin(u.login);
    setPassword("");
    setRole(u.role === "VIEWER" ? "RAHBAR" : u.role);
    setIsActive(u.isActive);
    setOpen(true);
  }

  async function submit() {
    setPending(true);
    try {
      const res = editing
        ? await updateUserAction(editing.id, { fullName, login, role, password, isActive })
        : await createUserAction({ fullName, login, role, password });
      if (!res.ok) throw new Error(res.error);
      toast.success(tc("save") + " ✓");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function doDelete(id: string) {
    setPending(true);
    try {
      const res = await deleteUserAction(id);
      if (!res.ok) throw new Error(res.error);
      toast.success(tc("delete") + " ✓");
      setDelId(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          {t("add")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("login")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="font-mono text-sm">{u.login}</TableCell>
                <TableCell>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "default" : "secondary"}>
                    {u.isActive ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600"
                      onClick={() => setDelId(u.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("login")}</Label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={!!editing}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? t("passwordEdit") : t("password")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editing ? "••••• (o'zgartirmaslik uchun bo'sh)" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("role")}</Label>
              <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                <option value="SUPERADMIN">Superadmin</option>
                <option value="ADMIN">Admin</option>
                <option value="RAHBAR">Rahbar</option>
              </select>
            </div>
            {editing && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                {t("active")}
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {tc("cancel")}
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)} disabled={pending}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={() => delId && doDelete(delId)} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
