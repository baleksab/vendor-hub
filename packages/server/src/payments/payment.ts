export const PAYMENT_KINDS = ["charge", "refund"] as const;

export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ["succeeded", "failed"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_FAILURE_REASONS = ["declined", "unknownCard"] as const;

export type PaymentFailureReason = (typeof PAYMENT_FAILURE_REASONS)[number];
