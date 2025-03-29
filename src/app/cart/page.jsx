"use client"
import { CartProductTable } from "@/components/cart/cartProductTable";
import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { context } from "@/context/contextProvider";
import Script from "next/script";
import { useSession } from "next-auth/react";
import CustomAlert from "@/components/common/customAlert";
import { useRouter } from "next/navigation";

export default function Cart() {
    const {cartItems, setCartItems} = useContext(context);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const {data: session} = useSession();
    const [showAlert, setShowAlert] = useState(false);
    const router = useRouter();
    const [filteredItems, setFilteredItems] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsPaymentProcessing(true);
        
        try {
            const response = await fetch("/api/create-order", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    totalAmount,
                    items: filteredItems,
                    userId: session?.user?.id,
                }),
            });
            const data = await response.json();

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: totalAmount * 100,
                currency: "INR",
                name: "Food Delivery",
                description: "Payment for items in cart",
                order_id: data.id,
                handler: async (response) => {
                    console.log("Payment successful", response);
                    if (response.razorpay_payment_id) {
                        setFormData({
                            name: "",
                            email: "",
                            phone: "",
                            address: "",
                        });

                        setShowAlert(true);
                        
                        setTimeout(() => {
                            setShowAlert(false);
                            router.push("/profile");
                        }, 2000);
                    }

                    // Clear cart after successful payment
                    setCartItems([]);
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    address: formData.address
                },
                theme: {
                    color: "#000000",
                }
            }
            
            // Check if Razorpay is loaded and available
            if (typeof window !== 'undefined' && !window.Razorpay) {
                throw new Error("Razorpay SDK failed to load");
            }
            
            // Create Razorpay instance
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response){
                console.error("Payment failed", response.error);
                alert("Payment failed. Please try again.");
            });
            razorpay.open();
        } catch (error) {
            console.error("Error creating order", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsPaymentProcessing(false);
        }
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
        <div className="flex flex-col md:flex-row items-center justify-evenly gap-4 md:gap-12 w-full min-h-[calc(100vh-250px)]">
            {
                showAlert && (
                    <div className="w-full h-full">
                        <CustomAlert
                            title="Payment successful"
                            message="Your order has been placed successfully, Redirecting to profile..."
                            type="success"
                        />
                    </div>
                )
            }
            <Script 
                src="https://checkout.razorpay.com/v1/checkout.js" 
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("Razorpay script loaded successfully");
                }}
                onError={() => {
                    console.error("Failed to load Razorpay script");
                }}
            />
            <div className="flex flex-col flex-1 items-center justify-center w-full md:w-1/2 h-full">
                <CartProductTable totalAmount={totalAmount} setTotalAmount={setTotalAmount} cartItems={filteredItems} handleRemoveItem={handleRemoveItem} handleAddItem={handleAddItem} className="w-full h-full" />
            </div>
            <div className="flex w-full md:w-1/2 h-full">
                <div className="flex flex-col items-center justify-center w-full h-full md:p-8 ">
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
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Email</Label> */}
                                        <Input 
                                            type="email" 
                                            placeholder="Email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Email</Label> */}
                                        <Input 
                                            type="text" 
                                            placeholder="Phone Number" 
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* <Label>Address</Label> */}
                                        <Input 
                                            type="address" 
                                            placeholder="Address" 
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <Button className="bg-white text-black hover:bg-red-500 hover:text-white hover:shadow-sm hover:shadow-gray-100" disabled={isPaymentProcessing || filteredItems.length === 0} type="submit">
                                        {isPaymentProcessing ? "Processing..." : "Checkout"}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    )
}