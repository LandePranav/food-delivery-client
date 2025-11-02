"use client"
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
// Fetch delivery charge from backend with react query
export const useFetchDeliveryCharge = () => {
    return useQuery({
        queryKey: ["deliveryCharge"],
        queryFn: async () => {
            const response = await api.get('/cart');
            return response.data;
        },
        onError: () => {
            toast.error("Failed to fetch delivery charge.");
            console.error("Failed to fetch delivery charge.");
        }
    })
}