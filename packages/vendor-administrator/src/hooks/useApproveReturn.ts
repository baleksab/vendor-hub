import { approveReturn } from "../api/orders";
import { useOrderMutation } from "./useOrderMutation";

export function useApproveReturn(id: string) {
  return useOrderMutation<void>(id, (client, orderId) => approveReturn(client, orderId));
}
