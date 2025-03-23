"use client"
import { CartProductTable } from "@/components/cart/cartProductTable";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { context } from "@/context/contextProvider";

export default function Cart() {
    const {cartItems, setCartItems} = useContext(context);

    const [filteredItems, setFilteredItems] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        address: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
    }

    useEffect(() => {
        const map = new Map();
        console.log(cartItems);
        cartItems.forEach((item) => {
            if (map.has(item.id)) {
                map.set(item.id,{...item, quantity: map.get(item.id).quantity + 1});
            } else {
                map.set(item.id, {...item, quantity: 1});
            }
        })
        setFilteredItems(Array.from(map.values()));
    }, [cartItems]);


    const handleRemoveItem = (id) => {
        const index = cartItems.findIndex((item) => item.id === id);
        if (index !== -1) {
            const newCartItems = [...cartItems];
            newCartItems.splice(index, 1);
            setCartItems(newCartItems);
        }
    }

    const handleAddItem = (id) => {
        setCartItems((prev) => [...prev, cartItems.find((item) => item.id === id)]);
    }

    return(
        <div className="flex flex-col md:flex-row items-center justify-evenly gap-12 w-full min-h-[calc(100vh-250px)]">
            <div className="flex flex-col flex-1 items-center justify-center w-1/2 h-full">
                <CartProductTable cartItems={filteredItems} handleRemoveItem={handleRemoveItem} handleAddItem={handleAddItem} className="w-full h-full" />
            </div>
            <div className="flex w-1/2 h-full">
                <div className="flex flex-col items-center justify-center w-full h-full p-8 ">
                    <Card className="bg-transparent text-white w-full h-full">
                        <CardHeader className="text-center">
                            <CardTitle>Checkout</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Name</Label> */}
                                        <Input 
                                            type="text" 
                                            placeholder="Name" 
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Email</Label> */}
                                        <Input 
                                            type="email" 
                                            placeholder="Email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Address</Label> */}
                                        <Input 
                                            type="address" 
                                            placeholder="Address" 
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    <Button className="bg-white text-black hover:bg-red-500 hover:text-white hover:shadow-sm hover:shadow-gray-100" type="submit">Checkout</Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    )
}