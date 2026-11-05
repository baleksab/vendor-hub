import { Stack } from "@mantine/core";

import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Home";
import { Architecture } from "./components/Architecture";
import { CallToAction } from "./components/CallToAction";
import { Features } from "./components/Features";
import { Hero } from "./components/Hero";
import { Steps } from "./components/Steps";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.home.title",
    descriptionKey: "seo.home.description",
    path: "/",
  });
}

export default function Home() {
  return (
    <Stack gap={64} py={{ base: "lg", sm: 56 }}>
      <Hero />
      <Features />
      <Steps />
      <Architecture />
      <CallToAction />
    </Stack>
  );
}
