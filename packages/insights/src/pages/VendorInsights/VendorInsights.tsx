import { BarChart } from "@mantine/charts";
import {
  Anchor,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import type { VendorInsightsResponse } from "@vendor-hub/types";
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
import { RoleBadge } from "../../components/RoleBadge";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { usePeriodCurrency } from "../../hooks/usePeriodCurrency";
import { useVendorInsights } from "../../hooks/useVendorInsights";
import { INSIGHTS_PATH, insightsProductPath, manageVendorPath, vendorSitePath } from "../../paths";
import { bucketFormatter } from "../bucketFormat";

const NOT_FOUND = 404;
const SKELETON_HEIGHT = 320;

type Kpis = VendorInsightsResponse["kpis"];

export default function VendorInsights() {
  const t = useT();
  const locale = useLocale();
  const { id = "" } = useParams();
  const { period, currency, update } = usePeriodCurrency();
  const { data, error, isPending, refetch } = useVendorInsights(id, { period, currency });

  const back = <BackLink to={INSIGHTS_PATH} label={t("vendor.back")} linkComponent={Link} />;

  if (isPending) {
    return <Skeleton height={SKELETON_HEIGHT} />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return (
        <EmptyState
          title={t("vendor.notFound.title")}
          description={t("vendor.notFound.message")}
          action={back}
        />
      );
    }

    return (
      <Stack>
        {back}
        <ErrorAlert
          title={t("vendor.loadError.title")}
          message={t("vendor.loadError.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  const { meta, vendor, kpis, catalog } = data;
  const money = (minor: number) => formatPrice(minor, meta.currency, locale);
  const countries = new Intl.DisplayNames(locale, { type: "region" });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  const card = (
    label: string,
    pair: Kpis["netMinor"],
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
          <Title order={1}>{vendor.name}</Title>
          <Group gap="sm">
            <RoleBadge role={vendor.viewerRole} />
            <Anchor href={vendorSitePath(vendor.slug)} size="sm">
              {t("vendor.site")}
            </Anchor>
          </Group>
        </Stack>
        <Button component={Link} to={manageVendorPath(vendor.id)} variant="default" mih={44}>
          {t("vendor.manage")}
        </Button>
      </Group>

      <InsightsBar meta={meta} onChange={update} />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
        {card(t("kpi.net"), kpis.netMinor, money)}
        {card(t("kpi.gross"), kpis.grossMinor, money)}
        {card(t("kpi.refunded"), kpis.refundedMinor, money, false)}
        {card(t("kpi.orders"), kpis.orders, String)}
        {card(t("kpi.units"), kpis.units, String)}
        {card(t("kpi.average"), kpis.averageOrderMinor, money)}
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={2} size="h4">
            {t("vendor.chart.revenue")}
          </Title>
          <TimeSeriesChart
            label={t("vendor.chart.revenue")}
            data={data.revenueSeries}
            series={[{ name: "netMinor", label: t("kpi.net"), color: "primer.6" }]}
            valueFormatter={money}
            tickFormatter={bucketFormatter(locale)}
          />
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Title order={2} size="h4">
              {t("vendor.chart.status")}
            </Title>
            {data.ordersByStatus.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("common.noData")}
              </Text>
            ) : (
              <BarChart
                h={260}
                data={data.ordersByStatus.map((row) => ({
                  status: t(`status.${row.status}`),
                  count: row.count,
                }))}
                dataKey="status"
                series={[{ name: "count", label: t("kpi.orders"), color: "primer.6" }]}
                orientation="vertical"
                yAxisProps={{ width: 120 }}
                withLegend={false}
              />
            )}
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Title order={2} size="h4">
              {t("vendor.catalog")}
            </Title>
            <SimpleGrid cols={2} spacing="sm">
              <div>
                <Text size="sm" c="dimmed">
                  {t("vendors.col.products")}
                </Text>
                <Text fw={600}>{catalog.productCount}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  {t("vendor.outOfStock")}
                </Text>
                <Text fw={600}>{catalog.outOfStockCount}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  {t("kpi.refundRate")}
                </Text>
                <Text fw={600}>{percent.format(kpis.refundRate.value)}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  {t("vendors.col.rating")}
                </Text>
                <StarRating
                  value={catalog.ratingAvg}
                  count={catalog.ratingCount}
                  label={t("vendors.ratingLabel", { value: catalog.ratingAvg })}
                />
              </div>
            </SimpleGrid>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={2} size="h4">
            {t("vendor.topProducts")}
          </Title>
          {data.topProducts.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t("common.noData")}
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={420}>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("product.name")}</Table.Th>
                    <Table.Th>{t("kpi.units")}</Table.Th>
                    <Table.Th>{t("kpi.net")}</Table.Th>
                    <Table.Th>{t("vendors.col.rating")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.topProducts.map((product) => (
                    <Table.Tr key={product.productId}>
                      <Table.Td>
                        {product.available ? (
                          <Anchor
                            component={Link}
                            to={insightsProductPath(vendor.id, product.productId)}
                            size="sm"
                          >
                            {product.name}
                          </Anchor>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {product.name} ({t("product.removed")})
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>{product.unitsSold}</Table.Td>
                      <Table.Td>{money(product.netMinor)}</Table.Td>
                      <Table.Td>
                        {product.ratingAvg === null ? "–" : product.ratingAvg.toFixed(1)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={2} size="h4">
            {t("vendor.topCountries")}
          </Title>
          {data.topCountries.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t("common.noData")}
            </Text>
          ) : (
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("vendor.country")}</Table.Th>
                  <Table.Th>{t("kpi.orders")}</Table.Th>
                  <Table.Th>{t("kpi.net")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.topCountries.map((row) => (
                  <Table.Tr key={row.country}>
                    <Table.Td>{countries.of(row.country) ?? row.country}</Table.Td>
                    <Table.Td>{row.orders}</Table.Td>
                    <Table.Td>{money(row.netMinor)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
