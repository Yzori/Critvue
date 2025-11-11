import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, createReview, type CreateReviewResponse, type CreateReviewRequest } from "@/lib/api/reviews";
import { toast } from "sonner";

/**
 * React Query hook for fetching reviews
 */
export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const data = await getReviews();
      return Array.isArray(data) ? data : [];
    },
  });
}

/**
 * React Query hook for creating a review with optimistic updates
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => createReview(data),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["reviews"] });

      // Snapshot the previous value
      const previousReviews = queryClient.getQueryData(["reviews"]);

      // Return a context object with the snapshotted value
      return { previousReviews };
    },
    onError: (_err, _newReview, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReviews) {
        queryClient.setQueryData(["reviews"], context.previousReviews);
      }
      toast.error("Failed to create review", {
        description: "Please try again",
      });
    },
    onSuccess: () => {
      toast.success("Review created successfully!");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
