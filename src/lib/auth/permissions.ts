export type Role = "SUPERADMIN" | "ADMIN" | "RAHBAR" | "VIEWER";

/** Rol bo'yicha ruxsatlar */
export function can(role: Role | null | undefined) {
  const r = role ?? "VIEWER";
  const editor = r === "SUPERADMIN" || r === "ADMIN";
  return {
    view: true, // hammasi ko'radi
    upload: editor, // Excel import
    editData: editor, // vagon qo'shish/tahrir/o'chirish
    deleteImport: editor, // import o'chirish
    manageUsers: r === "SUPERADMIN", // foydalanuvchi boshqaruvi
  };
}

export const ROLE_LABELS: Record<Exclude<Role, "VIEWER">, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  RAHBAR: "Rahbar",
};
