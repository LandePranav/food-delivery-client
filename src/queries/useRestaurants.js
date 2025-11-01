"use client"
import api from "@/lib/axios";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useFetchInfiniteRestaurants = (lat, lng, searchQuery, limit=9) => {
    return useInfiniteQuery({
        queryKey: ['restaurants', {lat, lng, searchQuery}],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get('/sellers', {
                params: {
                    lat,
                    lng,
                    page: pageParam,
                    limit,
                    ...(searchQuery && searchQuery.length > 0 && { searchQuery })
                }
            });
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
        onError: () => {
            toast.error("Failed to fetch restaurants.");
        }
});
}

export const useFetchRestaurantByID = (lat, lng, id) => {
    return useQuery({
        queryKey: ['restaurants', id],
        queryFn: async () => {
            const res = await api.get(`/sellers/${id}`, {
                params: {
                    lat,
                    lng
                }
            });
            console.log("Fetched restaurant data:", res.data);
            return res.data;
        },
        onError: () => {
            toast.error("Failed to fetch restaurant details.");
        }
    })
}