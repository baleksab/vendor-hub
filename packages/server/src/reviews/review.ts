export type ReviewTarget = "product" | "vendor";

export type Review = {
  id: string;
  userId: string;
  authorFirstName: string;
  authorLastName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewReview = {
  rating: number;
  comment: string | null;
};

export type ReviewSummary = {
  distribution: [number, number, number, number, number];
};
