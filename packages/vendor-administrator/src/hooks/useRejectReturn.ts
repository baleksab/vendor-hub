import { rejectReturn } from "../api/orders";
import { useOrderMutation } from "./useOrderMutation";

export function useRejectReturn(id: string) {
  return useOrderMutation<string>(id, (client, orderId, reason) =>
    rejectReturn(client, orderId, reason),
  );
}
