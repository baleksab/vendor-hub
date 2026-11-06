import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateVendorRequest } from "@vendor-hub/types";

import { vendorKeys } from "../api/queryKeys";
import { updateVendor } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useUpdateVendor(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateVendorRequest) => updateVendor(client, id, body),
    onSuccess: async (updated) => {
      queryClient.setQueryData(vendorKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
