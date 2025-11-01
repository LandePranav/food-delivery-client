"use client"
import api from "@/lib/axios";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useFetchInfiniteProducts = (lat, lng, searchQuery, category, limit=8, sellerId='', options={}) => {
    return useInfiniteQuery({
        queryKey: ['products', sellerId, {lat, lng, searchQuery, category, limit, ...options}],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get('/products', {
                params: {
                    lat,
                    lng,
                    page: pageParam,
                    limit,
                    ...(searchQuery && searchQuery.length > 0 && { searchQuery }),
                    ...(category && {category:category.toLowerCase()}),
                    ...(sellerId && sellerId.length > 0 && {sellerId}),
                    ...options
                }
            });
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
        onError: () => {
            toast.error("Failed to fetch products.");
        }
});
}

export const useFetchProductByID = (lat, lng, id) => {
    return useQuery({
        queryKey: ["products", id],
        queryFn: async () => {
            const res = await api.get(`/products/${id}`, {
                params: {
                    lat,
                    lng
                }
            });
            return res.data;
        },
        onError: () => {
            toast.error("Failed to fetch product details.");
        }
    })
}