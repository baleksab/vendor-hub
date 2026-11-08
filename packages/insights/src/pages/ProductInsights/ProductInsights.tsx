import { BarChart } from "@mantine/charts";
import { Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import {
  BackLink,
  EmptyState,
  ErrorAlert,
  KpiCard,
  StarRating,
  TimeSeriesChart,
  formatPrice,
} from "@vendor-hub/ui";
import { Link, useParams } from "react-router";

import { InsightsBar } from "../../components/InsightsBar";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { usePeriodCurrency } from "../../hooks/usePeriodCurrency";
import { useProductInsights } from "../../hooks/useProductInsights";
import { insightsVendorPath, manageProductPath } from "../../paths";
import { bucketFormatter } from "../bucketFormat";

const NOT_FOUND = 404;
const SKELETON_HEIGHT = 320;

export default function ProductInsights() {
  const t = useT();
  const locale = useLocale();
  const { id: vendorId = "", productId = "" } = useParams();
  const { period, currency, update } = usePeriodCurrency();
  const { data, error, isPending, refetch } = useProductInsights(productId, { period, currency });

  const back = (
    <BackLink to={insightsVendorPath(vendorId)} label={t("product.back")} linkComponent={Link} />
  );

  if (isPending) {
    return <Skeleton height={SKELETON_HEIGHT} />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return (
        <EmptyState
          title={t("product.notFound.title")}
          description={t("product.notFound.message")}
          action={back}
        />
      );
    }

    return (
      <Stack>
        {back}
        <ErrorAlert
          title={t("product.loadError.title")}
          message={t("product.loadError.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  const { meta, product, kpis } = data;
  const money = (minor: number) => formatPrice(minor, meta.currency, locale);
  const tick = bucketFormatter(locale);

  const card = (
    label: string,
    pair: typeof kpis.netMinor,
    format: (value: number) => string,
    higherIsBetter = true,
  ) => (
    <KpiCard
      label={label}
      value={format(pair.value)}
      current={pair.value}
      previous={pair.previous}
      deltaLabel={t("kpi.deltaLabel", { label })}
      noDataLabel={t("trend.new")}
      higherIsBetter={higherIsBetter}
    />
  );

  return (
    <Stack gap="lg">
      {back}

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={4}>
          <Title order={1}>{product.name}</Title>
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {product.vendorName}
            </Text>
            <StarRating
              value={product.ratingAvg}
              count={product.ratingCount}
              label={t("vendors.ratingLabel", { value: product.ratingAvg })}
            />
          </Group>
        </Stack>
        <Button
          component={Link}
          to={manageProductPath(product.vendorId, product.id)}
          variant="default"
          mih={44}
        >
          {t("product.manage")}
        </Button>
      </Group>

      <InsightsBar meta={meta} onChange={update} />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
        {card(t("kpi.net"), kpis.netMinor, money)}
        {card(t("kpi.gross"), kpis.grossMinor, money)}
        {card(t("kpi.refunded"), kpis.refundedMinor, money, false)}
        {card(t("kpi.orders"), kpis.orders, String)}
        {card(t("kpi.units"), kpis.units, String)}
        <Paper withBorder radius="md" p="md">
          <Stack gap={6}>
            <Text size="sm" c="dimmed">
              {t("product.stock")}
            </Text>
            <Text fz={26} fw={700} lh={1.1}>
              {product.stock}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={2} size="h4">
            {t("product.chart.sales")}
          </Title>
          <TimeSeriesChart
            label={t("product.chart.sales")}
            data={data.salesSeries}
            series={[{ name: "netMinor", label: t("kpi.net"), color: "primer.6" }]}
            valueFormatter={money}
            tickFormatter={tick}
          />
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Title order={2} size="h4">
              {t("product.chart.units")}
            </Title>
            <TimeSeriesChart
              label={t("product.chart.units")}
              data={data.salesSeries}
              series={[{ name: "units", label: t("kpi.units"), color: "teal.6" }]}
              tickFormatter={tick}
            />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Title order={2} size="h4">
              {t("product.chart.ratings")}
            </Title>
            <BarChart
              h={260}
              data={data.ratingDistribution.map((row) => ({
                rating: `${row.rating}★`,
                count: row.count,
              }))}
              dataKey="rating"
              series={[{ name: "count", label: t("product.reviews"), color: "yellow.6" }]}
              withLegend={false}
            />
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={2} size="h4">
            {t("product.chart.reviews")}
          </Title>
          <TimeSeriesChart
            label={t("product.chart.reviews")}
            data={data.reviewsSeries}
            series={[{ name: "count", label: t("product.reviews"), color: "grape.6" }]}
            tickFormatter={tick}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
