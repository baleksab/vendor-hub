import {
  Badge,
  Box,
  Group,
  Image,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useState } from "react";

import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "../SeoFields/SeoFields";

const MOBILE_DESCRIPTION_MAX = 120;
const MOBILE_WIDTH = 360;
const DESKTOP_WIDTH = 600;
const TITLE_LINES_MOBILE = 2;
const DESCRIPTION_LINES_SOCIAL = 2;
const SOCIAL_IMAGE_RATIO = 1.91;
const ELLIPSIS = "…";

const LINK_COLOR = "light-dark(var(--mantine-color-blue-8), var(--mantine-color-blue-3))";
const URL_COLOR = "light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-4))";

type Device = "desktop" | "mobile";
type Mode = "google" | "social";

export type SeoPreviewLabels = {
  google: string;
  social: string;
  desktop: string;
  mobile: string;
  usingDefault: string;
  note: string;
  empty: string;
};

type Props = {
  title: string;
  description: string;
  url: string;
  siteName: string;
  imageUrl?: string;
  usingDefaultTitle: boolean;
  usingDefaultDescription: boolean;
  labels: SeoPreviewLabels;
};

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}${ELLIPSIS}`;
}

function breadcrumb(url: string): string {
  try {
    const parsed = new URL(url);

    return [parsed.host, ...parsed.pathname.split("/").filter(Boolean)].join(" › ");
  } catch {
    return url;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function GoogleResult({
  title,
  description,
  url,
  siteName,
  device,
  usingDefaultTitle,
  usingDefaultDescription,
  labels,
}: Omit<Props, "imageUrl"> & { device: Device }) {
  const mobile = device === "mobile";
  const shownTitle = mobile ? title : truncate(title, SEO_TITLE_MAX);
  const shownDescription = truncate(
    description,
    mobile ? MOBILE_DESCRIPTION_MAX : SEO_DESCRIPTION_MAX,
  );

  return (
    <Box maw={mobile ? MOBILE_WIDTH : DESKTOP_WIDTH}>
      <Stack gap={4}>
        <Box>
          <Text size="sm" fw={500} lh={1.3}>
            {siteName}
          </Text>
          <Text size="xs" c={URL_COLOR} lh={1.3} truncate>
            {breadcrumb(url)}
          </Text>
        </Box>
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <Text
            size="xl"
            c={LINK_COLOR}
            lh={1.3}
            lineClamp={mobile ? TITLE_LINES_MOBILE : 1}
            style={{ flex: 1, minWidth: 0 }}
          >
            {shownTitle}
          </Text>
          {usingDefaultTitle ? (
            <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
              {labels.usingDefault}
            </Badge>
          ) : null}
        </Group>
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <Text size="sm" lh={1.5} style={{ flex: 1, minWidth: 0 }}>
            {shownDescription === "" ? labels.empty : shownDescription}
          </Text>
          {usingDefaultDescription ? (
            <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
              {labels.usingDefault}
            </Badge>
          ) : null}
        </Group>
      </Stack>
    </Box>
  );
}

function SocialCard({
  title,
  description,
  url,
  imageUrl,
}: Pick<Props, "title" | "description" | "url" | "imageUrl">) {
  return (
    <Paper withBorder radius="md" maw={DESKTOP_WIDTH} style={{ overflow: "hidden" }}>
      {imageUrl === undefined ? null : (
        <Image src={imageUrl} alt="" style={{ aspectRatio: SOCIAL_IMAGE_RATIO }} fit="cover" />
      )}
      <Stack gap={2} p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          {hostOf(url)}
        </Text>
        <Text fw={600} lineClamp={1}>
          {title}
        </Text>
        <Text size="sm" c="dimmed" lineClamp={DESCRIPTION_LINES_SOCIAL}>
          {description}
        </Text>
      </Stack>
    </Paper>
  );
}

export function SeoPreview(props: Props) {
  const { imageUrl, labels } = props;
  const [mode, setMode] = useState<string | null>("google");
  const [device, setDevice] = useState<Device>("desktop");
  const active: Mode = mode === "social" && imageUrl !== undefined ? "social" : "google";

  return (
    <Stack gap="sm">
      <Tabs value={active} onChange={setMode} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="google">{labels.google}</Tabs.Tab>
          {imageUrl === undefined ? null : <Tabs.Tab value="social">{labels.social}</Tabs.Tab>}
        </Tabs.List>
      </Tabs>

      {active === "google" ? (
        <SegmentedControl
          size="xs"
          w="fit-content"
          value={device}
          onChange={(value) => setDevice(value as Device)}
          data={[
            { value: "desktop", label: labels.desktop },
            { value: "mobile", label: labels.mobile },
          ]}
        />
      ) : null}

      <Paper withBorder radius="md" p="md">
        {active === "google" ? (
          <GoogleResult {...props} device={device} />
        ) : (
          <SocialCard {...props} />
        )}
      </Paper>

      <Text size="xs" c="dimmed">
        {labels.note}
      </Text>
    </Stack>
  );
}
