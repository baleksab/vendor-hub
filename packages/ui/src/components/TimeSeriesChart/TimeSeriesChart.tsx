import { AreaChart, type AreaChartSeries } from "@mantine/charts";
import { VisuallyHidden } from "@mantine/core";

const CHART_HEIGHT = 260;

type Props = {
  data: Record<string, string | number>[];
  series: AreaChartSeries[];
  label: string;
  valueFormatter?: (value: number) => string;
  tickFormatter?: (value: string) => string;
};

export function TimeSeriesChart({ data, series, label, valueFormatter, tickFormatter }: Props) {
  return (
    <>
      <VisuallyHidden>{label}</VisuallyHidden>
      <AreaChart
        h={CHART_HEIGHT}
        data={data}
        dataKey="bucket"
        series={series}
        curveType="monotone"
        withDots={false}
        withLegend={series.length > 1}
        tickLine="x"
        gridAxis="xy"
        valueFormatter={valueFormatter}
        xAxisProps={{ tickFormatter, minTickGap: 24 }}
        aria-label={label}
      />
    </>
  );
}
