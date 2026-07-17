"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Field } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Typography } from "@components/ui/typography";
import { getErrorMessage } from "@lib/get-error-message";

import { updateAccount } from "../api/accounts.service";
import { settingsSchema, type SettingsValues } from "../schemas/settings.schema";
import { useDashboardData } from "./DashboardProvider";
import { Panel } from "./Panel";

/**
 * The journal's settings.
 *
 * Exists because `startingBalance` is the one number the trades cannot supply:
 * every balance, growth figure and drawdown percentage is measured *from* it. The
 * account itself is never created or deleted here — it is a singleton the API
 * provisions, so this page adjusts it and nothing more.
 */
export function SettingsPage() {
  const { account } = useDashboardData();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    // `values` (not defaultValues) so the form re-seeds once the server payload
    // lands, instead of freezing whatever it mounted with.
    values: {
      startingBalance: account?.startingBalance ?? 0,
      currency: account?.currency ?? "USD",
    },
  });

  if (!account) {
    return (
      <Panel title="Settings" description="Starting balance and currency for the journal.">
        <div className="rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center">
          <Typography variant="body-base" className="text-muted-foreground">
            The journal is still initialising. Refresh in a moment.
          </Typography>
        </div>
      </Panel>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const id = toast.loading("Saving settings…");
    try {
      await updateAccount(account.id, settingsSchema.parse(values));
      // The account is loaded on the server, so re-running the loader is what
      // re-bases every metric on screen — not a local setState.
      router.refresh();
      reset(values);
      toast.success("Settings saved.", { id });
    } catch (error) {
      toast.error(getErrorMessage(error), { id });
    }
  });

  return (
    <Panel title="Settings" description="Starting balance and currency for the journal.">
      {/* noValidate: Zod owns validation, so the browser's own bubbles would be a
          second, differently-worded opinion. */}
      <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
        <Field
          label="Starting balance"
          htmlFor="startingBalance"
          error={errors.startingBalance?.message}
          hint="— what your equity curve is measured from"
        >
          <Input
            id="startingBalance"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            aria-invalid={Boolean(errors.startingBalance)}
            {...register("startingBalance")}
          />
        </Field>

        <Field label="Currency" htmlFor="currency" error={errors.currency?.message}>
          <Input
            id="currency"
            maxLength={3}
            autoComplete="off"
            aria-invalid={Boolean(errors.currency)}
            {...register("currency")}
          />
        </Field>

        <Typography variant="body-sm" className="text-muted-foreground">
          Changing the starting balance re-bases every figure derived from it — closing balance,
          growth and drawdown. Your trades are untouched.
        </Typography>

        {/* Disabled until something actually changed: a save that cannot do
            anything should not look like it can. */}
        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Panel>
  );
}
