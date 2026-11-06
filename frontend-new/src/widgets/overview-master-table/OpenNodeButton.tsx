import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/shared/components/ui";
import type { PathNode } from "@/entities/hierarchy";
import { useOpenHierarchyNode } from "@/features/select-hierarchy-node";
import { cn } from "@/shared/utils";

/** The overview tables' "open this row's dashboard" button styles. */
/**
 * Figma overview name boxes: #13A8A3 at 15% inside a #1D6B89 stroke (dark), #1D6B89
 * inside a #0C8785 stroke (light). Hover keeps the resting colours, as the frames
 * define none.
 */
export const NAME_BOX =
  "rounded-md border border-[#0C8785] dark:border-jjm-blue-light bg-jjm-blue-light hover:bg-jjm-blue-light text-white hover:text-white dark:bg-[#13A8A3]/15 dark:hover:bg-[#13A8A3]/15";

/** The overview tables' "open this row's dashboard" button styles. */
export const openNodeButtonVariants = cva("", {
  variants: {
    variant: {
      /** Name box: Circle, Division, Sub-Division, Block and Village tables. */
      primary: `${NAME_BOX} min-w-[5.5rem] h-[2.0625rem] px-3 text-[0.8125rem] font-semibold dark:text-jjm-cyan dark:hover:text-jjm-cyan`,
      /** Alias of `primary`, kept for existing callers. */
      filled: `${NAME_BOX} min-w-[5.5rem] h-[2.0625rem] px-3 text-[0.8125rem] font-semibold dark:text-jjm-cyan dark:hover:text-jjm-cyan`,
      /** Scheme ID box (the name sits under it): the Scheme table. */
      card: `${NAME_BOX} w-[12.25rem] max-w-full h-[2.0625rem] px-3 text-sm font-semibold`,
      /** Solid button: the ESR table. */
      large:
        "w-[11.125rem] max-w-full h-[2.375rem] rounded-md bg-jjm-blue-light hover:bg-jjm-blue-light text-xs font-semibold text-white hover:text-white",
    },
  },
  defaultVariants: { variant: "primary" },
});

export interface OpenNodeButtonProps extends VariantProps<typeof openNodeButtonVariants> {
  /** The row's path (its state -> its node); the dashboard fetches that branch. */
  path: PathNode[];
  /** Tooltip, e.g. "Click to view detailed Circle Dashboard". */
  title: string;
  children: ReactNode;
  className?: string;
}

/** Opens a row's tier dashboard with its full ancestry recorded. */
export function OpenNodeButton({ path, title, variant, className, children }: OpenNodeButtonProps) {
  const openNode = useOpenHierarchyNode();
  const classes = openNodeButtonVariants({ variant });
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => openNode(path)}
      className={className ? cn(classes, className) : classes}
      title={title}
    >
      {children}
    </Button>
  );
}
