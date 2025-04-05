"use client"
import { CartProductTable } from "@/components/cart/cartProductTable";
import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { context } from "@/context/contextProvider";
import Script from "next/script";
import { useSession } from "next-auth/react";
import CustomAlert from "@/components/common/customAlert";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/page-layout";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { ShoppingCart, Trash, Lock, Plus, Minus, AlertTriangle } from "lucide-react";
import Image from "next/image";
import api from "@/lib/axios";

export default function Cart() {
    const {cartItems, setCartItems, addToCart, removeFromCart, removeItemCompletely, calculateCartTotal} = useContext(context);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const {data: session, status} = useSession();
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState("");
    const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });

    // Calculate total quantity of items in cart
    const totalCartItems = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

    // Get user's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }, []);

    // Prefill form data if user is logged in
    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || prev.name,
                email: session.user.email || prev.email,
            }));
            
            // Fetch user addresses
            fetchUserInfo();
        }
    }, [session]);

    useEffect(() => {
        setTotalAmount(calculateCartTotal());
    }, [cartItems, calculateCartTotal]);
    
    // Fetch user addresses
    const fetchUserInfo = async () => {
        try {
            const response = await api.get('/users');
            const userInfo = response.data;
            console.log(userInfo);
            setAddresses(userInfo.addresses || []);
            
            // If there's at least one address, set it as the selected address
            if (addresses && addresses.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    address: addresses[0]
                }));
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
        }
    };
    
    // Add a new address
    const handleAddNewAddress = async () => {
        if (!newAddress.trim()) return;
        
        try {
            const response = await api.patch('/users', { address: newAddress });
            const data = response.data;
            if (data.success) {
                setAddresses(prev => [...prev, newAddress]);
                setFormData(prev => ({
                    ...prev,
                    address: newAddress
                }));
                setNewAddress("");
                setShowAddressForm(false);
            } else {
                console.error("Error adding address:", data.error);
            }
        } catch (error) {
            console.error("Error adding address:", error);
        }
    };

    // Check if all products belong to the same seller/restaurant
    const checkSameRestaurant = () => {
        if (cartItems.length <= 1) return true;
        
        const firstSellerId = cartItems[0].sellerId;
        return cartItems.every(item => item.sellerId === firstSellerId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // If user is not authenticated, redirect to login and save cart state
        if (!session?.user) {
            localStorage.setItem('pendingCart', 'true');
            router.push('/api/auth/signin');
            return;
        }
        
        // Check if all products belong to the same restaurant
        if (!checkSameRestaurant()) {
            setAlertType("error");
            setAlertMessage("You can only order items from the same restaurant in a single order. Please remove items from different restaurants.");
            setShowAlert(true);
            
            // Hide alert after 5 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            
            return;
        }
        
        // Validate that address is not empty
        if (!formData.address || formData.address.trim() === '') {
            setAlertType("error");
            setAlertMessage("Please provide a delivery address");
            setShowAlert(true);
            
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            
            return;
        }
        
        setIsPaymentProcessing(true);
        
        try {
            // Create an order with user details and cart items
            const orderData = {
                ...formData,
                items: cartItems,
                userId: session.user.id,
                totalAmount: totalAmount,
                gpsLocation: userLocation
            };
            
            // Submit order to API
            const response = await api.post('/create-order', orderData);
            console.log("Order Response : ", response);
            const data = response.data;

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
                    address: formData.address,
                    gpsLocation: userLocation
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
            
            if (data.success) {
                // Clear cart after successful order
                setCartItems([]);
                setAlertType("success");
                setAlertMessage("Order placed successfully!");
                setShowAlert(true);
                setTimeout(() => {
                    router.push("/profile");
                }, 2000);
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            setAlertType("error");
            setAlertMessage("There was an error placing your order. Please try again.");
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        } finally {
            setIsPaymentProcessing(false);
        }
    }

    const handleRemoveItem = (id) => {
        removeFromCart(id);
    }

    const handleAddItem = (id) => {
        const item = cartItems.find(item => item.id === id);
        if (item) {
            addToCart(item);
        }
    }

    const handleDeleteItem = (id) => {
        removeItemCompletely(id);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    // Helper function to get the best available image URL
    const getImageUrl = (item) => {
        if (item.imageUrl) return item.imageUrl;
        if (item.image) return item.image;
        if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
        return "/placeholder.jpg";
    }

    // Format price with rupee symbol
    const formatPrice = (price) => {
        return `₹${price.toFixed(2)}`;
    };

    return(
        <PageLayout>
            {showAlert && (
                <div className="w-full h-full">
                    <CustomAlert
                        title={alertType === "success" ? "Success" : "Error"}
                        message={alertMessage}
                        type={alertType}
                    />
                </div>
            )}
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
            
            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center mb-6">
                        <ShoppingCart className="h-10 w-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">Looks like you haven't added any items to your cart yet.</p>
                    <Link href="/menu" className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full">
                        Browse Menu
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Cart Items */}
                    <div className="lg:w-2/3">
                        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Items ({totalCartItems})</h2>
                            </div>
                            
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {cartItems.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="flex items-center p-4">
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                            <Image
                                                src={getImageUrl(item)}
                                                alt={item.name}
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                        </div>
                                        
                                        <div className="ml-4 flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                {formatPrice(item.price)} × {item.quantity || 1} = {formatPrice(item.price * (item.quantity || 1))}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            
                                            <span className="text-sm font-medium w-6 text-center">{item.quantity || 1}</span>
                                            
                                            <button
                                                onClick={() => handleAddItem(item.id)}
                                                className="p-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                            >
                                                <Trash className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4 bg-gray-50 dark:bg-[#292929] flex justify-between items-center">
                                <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Checkout Form */}
                    <div className="lg:w-1/3">
                        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow p-4">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Checkout</h2>
                            
                            {!session?.user && (
                                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-center">
                                    <Lock className="h-5 w-5 text-yellow-500 mr-2" />
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Sign in required for checkout</p>
                                </div>
                            )}
                            
                            {!checkSameRestaurant() && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        Items from different restaurants detected. Please order from a single restaurant at a time.
                                    </p>
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                    />
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Delivery Address
                                    </label>
                                    
                                    {addresses.length > 0 && !showAddressForm ? (
                                        <div className="space-y-3">
                                            <select
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                            >
                                                {addresses.map((address, index) => (
                                                    <option key={index} value={address}>
                                                        {address}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(true)}
                                                className="w-full text-sm text-red-500 hover:text-red-600 text-center"
                                            >
                                                + Add new address
                                            </button>
                                        </div>
                                    ) : showAddressForm ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={newAddress}
                                                onChange={(e) => setNewAddress(e.target.value)}
                                                rows="2"
                                                placeholder="Enter your full address"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                            ></textarea>
                                            
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewAddress}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md text-sm"
                                                >
                                                    Save Address
                                                </button>
                                                
                                                {addresses.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddressForm(false)}
                                                        className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-1.5 px-3 rounded-md text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <textarea
                                                value={newAddress}
                                                onChange={(e) => setNewAddress(e.target.value)}
                                                rows="2"
                                                placeholder="Enter your full address"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                            ></textarea>
                                            
                                            <button
                                                type="button"
                                                onClick={handleAddNewAddress}
                                                className="w-full bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md text-sm"
                                            >
                                                Save Address
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={!checkSameRestaurant()}
                                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                                        !checkSameRestaurant() 
                                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                >
                                    {!session?.user ? "Sign in to Checkout" : `Checkout ${formatPrice(totalAmount)}`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}