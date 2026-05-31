import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1D1E27]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#4B4E53] mt-1.5 font-medium">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}
