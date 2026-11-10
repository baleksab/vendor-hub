import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError } from "@vendor-hub/api-client";
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from "@vendor-hub/types";
import { BackLink, EmptyState, ErrorAlert } from "@vendor-hub/ui";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { SeoSection } from "../../components/SeoSection";
import { leafCategoryGroups } from "../../categoryOptions";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useCategories } from "../../hooks/useCategories";
import { useCreateProduct } from "../../hooks/useCreateProduct";
import { useProduct } from "../../hooks/useProduct";
import { useProducts } from "../../hooks/useProducts";
import { useUpdateProduct } from "../../hooks/useUpdateProduct";
import { useVendor } from "../../hooks/useVendor";
import { CURRENCIES, toMajor, toMinor } from "../../money";
import {
  insightsProductPath,
  productImagePath,
  productPath,
  productSitePath,
  productsPath,
} from "../../paths";
import { ImagesEditor } from "./ImagesEditor";
import { ReviewsModeration } from "./ReviewsModeration";

const SAVED_NOTICE_MS = 3000;
const NOT_FOUND = 404;
const NAME_MIN = 2;
const SKELETON_HEIGHT = 320;
const CURRENCY_SAMPLE_SIZE = 100;

type Currency = CreateProductRequest["currency"];

type FormValues = {
  name: string;
  description: string;
  category: string;
  price: number | string;
  currency: Currency;
  stock: number | string;
  seoTitle: string;
  seoDescription: string;
  seoImageId: string;
};

const FIRST_IMAGE = "first";

function toValues(product: ProductResponse): FormValues {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    price: toMajor(product.priceMinor),
    currency: product.currency,
    stock: product.stock,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    seoImageId: product.seoImageId ?? FIRST_IMAGE,
  };
}

function seoValue(value: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function toRequest(values: FormValues): CreateProductRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category as CreateProductRequest["category"],
    priceMinor: toMinor(Number(values.price)),
    currency: values.currency,
    stock: Number(values.stock),
    seoTitle: seoValue(values.seoTitle),
    seoDescription: seoValue(values.seoDescription),
  };
}

function changedFields(product: ProductResponse, values: FormValues): UpdateProductRequest {
  const next = toRequest(values);
  const body: UpdateProductRequest = {};

  if (next.name !== product.name) body.name = next.name;
  if (next.description !== product.description) body.description = next.description;
  if (next.category !== product.category) body.category = next.category;
  if (next.priceMinor !== product.priceMinor) body.priceMinor = next.priceMinor;
  if (next.currency !== product.currency) body.currency = next.currency;
  if (next.stock !== product.stock) body.stock = next.stock;
  if (next.seoTitle !== product.seoTitle) body.seoTitle = next.seoTitle;
  if (next.seoDescription !== product.seoDescription) body.seoDescription = next.seoDescription;
  const seoImageId = values.seoImageId === FIRST_IMAGE ? null : values.seoImageId;

  if (seoImageId !== product.seoImageId) body.seoImageId = seoImageId;

  return body;
}

function mostUsedCurrency(currencies: Currency[]): Currency {
  const counts = new Map<Currency, number>();

  for (const currency of currencies) {
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? CURRENCIES[0];
}

function ProductFields({
  vendorId,
  vendorSlug,
  vendorName,
  product,
  defaultCurrency,
}: {
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  product: ProductResponse | undefined;
  defaultCurrency: Currency;
}) {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const categories = useCategories();
  const create = useCreateProduct(vendorId);
  const update = useUpdateProduct(product?.id ?? "");
  const [alert, setAlert] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    initialValues: product
      ? toValues(product)
      : {
          name: "",
          description: "",
          category: "",
          price: "",
          currency: defaultCurrency,
          stock: 0,
          seoTitle: "",
          seoDescription: "",
          seoImageId: FIRST_IMAGE,
        },
    validate: {
      name: (value) =>
        value.trim().length === 0
          ? t("product.form.required")
          : value.trim().length < NAME_MIN
            ? t("product.form.tooShort")
            : null,
      description: (value) => (value.trim().length === 0 ? t("product.form.required") : null),
      category: (value) => (value === "" ? t("product.form.required") : null),
      price: (value) =>
        value === "" || Number.isNaN(Number(value)) || Number(value) < 0
          ? t("product.form.invalidNumber")
          : null,
      stock: (value) =>
        value === "" || !Number.isInteger(Number(value)) || Number(value) < 0
          ? t("product.form.invalidNumber")
          : null,
    },
  });

  const values = form.getValues();
  const previewName = values.name.trim() === "" ? (product?.name ?? "") : values.name.trim();
  const previewImageId =
    product?.images.find((image) => image.id === values.seoImageId)?.id ?? product?.images[0]?.id;

  useEffect(() => {
    if (!showSaved) return;

    const timer = setTimeout(() => setShowSaved(false), SAVED_NOTICE_MS);

    return () => clearTimeout(timer);
  }, [showSaved]);

  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.kind === "validation") {
      if (Object.keys(error.fieldErrors).length > 0) {
        form.setErrors(error.fieldErrors);
      } else {
        setAlert(`${t("product.form.rejected")} ${error.detail}`.trim());
      }
    } else if (!(error instanceof ApiError) || error.kind !== "unauthorized") {
      setAlert(t("product.form.failed"));
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setAlert(null);
    setShowSaved(false);

    try {
      if (product === undefined) {
        const created = await create.mutateAsync(toRequest(values));

        await navigate(productPath(vendorId, created.id));

        return;
      }

      const body = changedFields(product, values);

      if (Object.keys(body).length === 0) {
        setAlert(t("product.form.noChanges"));

        return;
      }

      const updated = await update.mutateAsync(body);

      form.setInitialValues(toValues(updated));
      form.reset();
      setShowSaved(true);
    } catch (error) {
      handleError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h4">
            {t("product.form.details")}
          </Title>

          <TextInput label={t("product.form.name")} size="md" {...form.getInputProps("name")} />
          <Textarea
            label={t("product.form.description")}
            minRows={4}
            autosize
            size="md"
            {...form.getInputProps("description")}
          />
          <Select
            label={t("product.form.category")}
            placeholder={t("product.form.categoryPlaceholder")}
            data={leafCategoryGroups(categories.data?.data ?? [], locale)}
            searchable
            size="md"
            {...form.getInputProps("category")}
          />
          <Group grow align="flex-start">
            <NumberInput
              label={t("product.form.price")}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              size="md"
              {...form.getInputProps("price")}
            />
            <Select
              label={t("product.form.currency")}
              data={[...CURRENCIES]}
              allowDeselect={false}
              size="md"
              {...form.getInputProps("currency")}
            />
          </Group>
          <NumberInput
            label={t("product.form.stock")}
            min={0}
            allowDecimal={false}
            allowNegative={false}
            size="md"
            {...form.getInputProps("stock")}
          />

          <SeoSection
            title={values.seoTitle}
            description={values.seoDescription}
            onTitleChange={(value) => form.setFieldValue("seoTitle", value)}
            onDescriptionChange={(value) => form.setFieldValue("seoDescription", value)}
            fallbackTitle={t("seo.product.fallbackTitle", {
              name: previewName,
              vendor: vendorName,
            })}
            fallbackDescription={values.description.trim()}
            url={new URL(
              productSitePath(vendorSlug, product?.id ?? ""),
              window.location.origin,
            ).toString()}
            siteName={vendorName}
            imageUrl={previewImageId === undefined ? undefined : productImagePath(previewImageId)}
            titleError={form.errors.seoTitle as string | undefined}
            descriptionError={form.errors.seoDescription as string | undefined}
            imageSlot={
              <Select
                label={t("seo.image.label")}
                description={product === undefined ? t("seo.image.saveFirst") : undefined}
                data={[
                  { value: FIRST_IMAGE, label: t("seo.image.first") },
                  ...(product?.images ?? []).map((image, index) => ({
                    value: image.id,
                    label: t("seo.image.option", { n: index + 1 }),
                  })),
                ]}
                disabled={product === undefined || product.images.length === 0}
                allowDeselect={false}
                size="md"
                {...form.getInputProps("seoImageId")}
              />
            }
          />

          {alert === null ? null : (
            <Alert color="red" role="alert">
              {alert}
            </Alert>
          )}
          {showSaved ? <Alert color="green">{t("product.form.saved")}</Alert> : null}

          <Group justify="flex-end">
            {product === undefined ? null : (
              <Button
                variant="default"
                onClick={() => {
                  form.reset();
                  setAlert(null);
                }}
                disabled={!form.isDirty() || pending}
              >
                {t("product.form.discard")}
              </Button>
            )}
            <Button
              type="submit"
              loading={pending}
              disabled={product !== undefined && !form.isDirty()}
            >
              {product === undefined ? t("product.form.create") : t("product.form.save")}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </form>
  );
}

export default function ProductForm() {
  const t = useT();
  const { id = "", productId } = useParams();
  const vendor = useVendor(id);
  const product = useProduct(productId);
  const sample = useProducts(vendor.data?.slug, { limit: CURRENCY_SAMPLE_SIZE, offset: 0 });

  const back = <BackLink to={productsPath(id)} label={t("products.title")} linkComponent={Link} />;

  const loading =
    vendor.isPending || (productId !== undefined && product.isPending) || sample.isPending;

  if (loading && !vendor.isError && !product.isError) {
    return <Skeleton height={SKELETON_HEIGHT} />;
  }

  const failure = vendor.error ?? product.error;

  if (failure) {
    if (failure instanceof ApiError && failure.status === NOT_FOUND) {
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
          message={t("products.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => {
            void vendor.refetch();
            void product.refetch();
          }}
        />
      </Stack>
    );
  }

  const current = productId === undefined ? undefined : product.data;
  const defaultCurrency = mostUsedCurrency((sample.data?.data ?? []).map((item) => item.currency));

  return (
    <Stack gap="md">
      {back}
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={1}>
          {current === undefined ? t("product.form.titleNew") : t("product.form.titleEdit")}
        </Title>
        {current === undefined || vendor.data?.memberRole == null ? null : (
          <Button
            component={Link}
            to={insightsProductPath(id, current.id)}
            variant="default"
            mih={44}
          >
            {t("insights.view")}
          </Button>
        )}
      </Group>
      {current === undefined ? (
        <Text size="sm" c="dimmed">
          {vendor.data?.name}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          {current.name}
        </Text>
      )}
      <ProductFields
        key={current?.id ?? "new"}
        vendorId={id}
        vendorSlug={vendor.data?.slug ?? ""}
        vendorName={vendor.data?.name ?? ""}
        product={current}
        defaultCurrency={defaultCurrency}
      />
      {current === undefined ? null : (
        <>
          <ImagesEditor product={current} />
          <ReviewsModeration productId={current.id} />
        </>
      )}
    </Stack>
  );
}
