"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteRecordAction,
  deleteWagonAction,
  deleteImportBatchAction,
} from "@/lib/actions/wagon";
import type { ActionResult } from "@/lib/wagon/types";

function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm: () => Promise<ActionResult>;
}) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function go() {
    setPending(true);
    try {
      const res = await onConfirm();
      if (!res.ok) throw new Error(res.error);
      toast.success(tc("delete") + " ✓");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={go} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteWagonButton({
  wagonId,
  number,
  compact = false,
}: {
  wagonId: string;
  number: string;
  compact?: boolean;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("wagons");
  const router = useRouter();

  return (
    <ConfirmDialog
      title={t("deleteWagon")}
      description={`${number} — ${t("deleteWagonConfirm")}`}
      onConfirm={async () => {
        const res = await deleteWagonAction(wagonId);
        if (res.ok) {
          if (!compact) router.push("/wagons");
          router.refresh();
        }
        return res;
      }}
      trigger={
        compact ? (
          <Button variant="ghost" size="icon-sm" className="text-red-600" aria-label={tc("delete")}>
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="size-4" />
            {tc("delete")}
          </Button>
        )
      }
    />
  );
}

export function DeleteRecordButton({ recordId }: { recordId: string }) {
  const t = useTranslations("wagons");
  const router = useRouter();

  return (
    <ConfirmDialog
      title={t("deleteRecord")}
      description={t("deleteRecordConfirm")}
      onConfirm={async () => {
        const res = await deleteRecordAction(recordId);
        if (res.ok) router.refresh();
        return res;
      }}
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-red-600">
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );
}

export function DeleteImportButton({
  batchId,
  fileName,
}: {
  batchId: string;
  fileName: string;
}) {
  const t = useTranslations("history");
  const tc = useTranslations("common");
  const router = useRouter();

  return (
    <ConfirmDialog
      title={t("deleteImport")}
      description={`${fileName} — ${t("deleteImportConfirm")}`}
      onConfirm={async () => {
        const res = await deleteImportBatchAction(batchId);
        if (res.ok) router.refresh();
        return res;
      }}
      trigger={
        <Button variant="outline" size="sm" className="text-red-600">
          <Trash2 className="size-4" />
          {tc("delete")}
        </Button>
      }
    />
  );
}
