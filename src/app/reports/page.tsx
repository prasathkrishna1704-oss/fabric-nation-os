import { getReportData } from "@/actions/reports";
import { PageHeader } from "@/components/layout/page-header";
import { ReportView } from "@/components/reports/report-view";

export const metadata = {
  title: "Reports — Fabric Nation",
  description: "Download weekly and monthly sales reports with and without GST breakdown",
};

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const { period } = await searchParams;
  const activePeriod = period === "monthly" ? "monthly" : period === "weekly" ? "weekly" : "daily";
  const data = await getReportData(activePeriod as "daily" | "weekly" | "monthly");

  return (
    <div className="p-6 lg:p-8 max-w-[1440px] mx-auto animate-fade-in">
      <PageHeader
        title="Reports"
        description="Download weekly & monthly sales reports"
      />
      <ReportView data={data} activePeriod={activePeriod} />
    </div>
  );
}
