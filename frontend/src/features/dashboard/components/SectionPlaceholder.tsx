import { Typography } from "@components/ui/typography";

import { Panel } from "./Panel";

interface Props {
  id?: string;
  title: string;
  description: string;
}

/** Stands in for a section whose slice has not landed yet. */
export function SectionPlaceholder({ id, title, description }: Props) {
  return (
    <Panel id={id} title={title} description={description}>
      <div className="rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center">
        <Typography variant="body-sm" className="text-muted-foreground">
          Not built yet.
        </Typography>
      </div>
    </Panel>
  );
}
