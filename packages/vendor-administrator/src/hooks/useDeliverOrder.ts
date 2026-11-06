import { deliverOrder } from "../api/orders";
import { useOrderMutation } from "./useOrderMutation";

export function useDeliverOrder(id: string) {
  return useOrderMutation<void>(id, (client, orderId) => deliverOrder(client, orderId));
}
