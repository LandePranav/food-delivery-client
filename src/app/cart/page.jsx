"use client"
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { context } from "@/context/contextProvider";
import Script from "next/script";
import { useSession } from "next-auth/react";
import CustomAlert from "@/components/common/customAlert";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/page-layout";
import Link from "next/link";
import { ShoppingCart, Trash, Lock, Plus, Minus, AlertTriangle, UtensilsCrossed } from "lucide-react";
import api from "@/lib/axios";
import { CldImage } from "next-cloudinary";
import { toast } from "sonner";
import {useFetchDeliveryCharge} from "@/queries/useCart";

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
    const [locationError, setLocationError] = useState(null);

    // Calculate total quantity of items in cart
    const totalCartItems = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    const {data:deliveryChargeData} = useFetchDeliveryCharge();
    const deliveryCharge = deliveryChargeData?.deliveryCharge || 0;

    // Get user's current location
    const requestLocationPermission = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const error = "Geolocation is not supported by this browser.";
                setLocationError(error);
                reject(new Error(error));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setUserLocation(location);
                    setLocationError(null);
                    resolve(location);
                },
                (error) => {
                    let errorMessage = "Unknown location error occurred.";
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location permission was denied. Please enable location services in your browser settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable. Please try again.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Location request timed out. Please try again.";
                            break;
                    }
                    
                    setLocationError(errorMessage);
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    };

    // Prefill form data if user is logged in
    useEffect(() => {
        if (session?.user) {
            fetchUserInfo();
        }
    }, [session]);

    useEffect(() => {
        setTotalAmount(calculateCartTotal());
    }, [cartItems, calculateCartTotal]);
    
    // Automatically request location when component mounts
    useEffect(() => {
        if (cartItems.length > 0 && session?.user) {
            // Only request location if we have items in cart and user is logged in
            requestLocationPermission().catch(error => {
                console.log("Initial location request failed:", error.message);
                // Don't show alert on initial load, just set the error state
                setLocationError(error.message);
            });
        }
    }, [cartItems.length, session]);
    
    // Fetch user addresses
    const fetchUserInfo = async () => {
        try {
            const response = await api.get('/users');
            const userInfo = response.data;
            setAddresses(userInfo.addresses || []);
            
            setFormData(prev => ({
                ...prev,
                name: userInfo.name,
                email: userInfo.email,
                address: userInfo?.addresses && userInfo.addresses.length > 0 ? userInfo.addresses[0] : "",
                phone: userInfo?.phone
            }))
            
            // If user has no addresses, show the address form by default
            if (!userInfo.addresses || userInfo.addresses.length === 0) {
                setShowAddressForm(true);
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

        // Check if we have valid GPS location
        if (userLocation.latitude === 0 && userLocation.longitude === 0) {
            toast.error("We need your location for delivery. Please allow location access.");
            
            try {
                const location = await requestLocationPermission();
                
                // Double-check if we got valid coordinates
                if (location.latitude === 0 && location.longitude === 0) {
                    setAlertType("error");
                    toast.error("Could not get valid location coordinates. Please try again.");
                    return;
                }
            } catch (error) {
                toast.error("Location permission is required for delivery. Please enable location access and try again.");
                return;
            }
        }
        
        // Validate GPS coordinates are not at null island (0,0)
        if (userLocation.latitude === 0 && userLocation.longitude === 0) {
            toast.error("Invalid location detected. Please refresh and allow location access.");
            return;
        }
        
        // Check if all products belong to the same restaurant
        if (!checkSameRestaurant()) {
            toast.error("You can only order items from the same restaurant in a single order. Please remove items from different restaurants.");
            return;
        }
        
        // Handle new address if it exists and user has no saved addresses
        if (addresses.length === 0 && newAddress.trim() !== '') {
            try {
                const response = await api.patch('/users', { address: newAddress });
                const data = response.data;
                if (data.success) {
                    setAddresses([newAddress]);
                    setFormData(prev => ({
                        ...prev,
                        address: newAddress
                    }));
                }
            } catch (error) {
                console.error("Error adding address:", error);
            }
        }
        
        // Validate that address is not empty
        if (!formData.address && !newAddress) {
            toast.error("Please provide a delivery address");
            return;
        }
        
        // Use newAddress if formData.address is empty
        const deliveryAddress = formData.address || newAddress;
        
        setIsPaymentProcessing(true);
        
        try {
            // Create an order with user details and cart items
            const orderData = {
                ...formData,
                address: deliveryAddress,
                items: cartItems,
                userId: session.user.id,
                totalAmount: totalAmount + deliveryCharge,
                gpsLocation: userLocation
            };
            
            // Submit order to API
            const response = await api.post('/create-order', orderData);

            if (response.data.success === false) {
                setAlertType("error");
                setAlertMessage(response.data.message);
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 5000);
                return;
            }

            const data = response.data;

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: "Food Delivery",
                description: "Payment for items in cart",
                order_id: data.orderId,
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
                    address: deliveryAddress,
                    gpsLocation: userLocation,
                    deliveryCharge: deliveryCharge,
                    contact: formData.phone,
                    sellerId: cartItems[0].sellerId,
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
                toast.success("Order placed successfully!");
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
        return ;
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
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Items ({totalCartItems})</h2>
                            </div>
                            
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {cartItems.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="flex items-center p-4">
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                            {item.image ? (
                                                <CldImage
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={64}
                                                    height={64}
                                                    crop="fill"
                                                    gravity="auto"
                                                    className="object-cover rounded-md absolute inset-0"
                                                />
                                            ) : (
                                                <div className="flex items-center rounded-md justify-center h-full bg-gray-100 dark:bg-[#262626]">
                                                    <UtensilsCrossed className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                                </div>
                                            )}
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
                            
                            <div className="p-4 bg-gray-50 dark:bg-[#292929]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                                    <span className="font-normal text-sm text-gray-900 dark:text-white">+ {formatPrice(deliveryCharge)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatPrice(totalAmount + deliveryCharge)}</span>
                                </div>
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
                                {
                                    session?.user && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData?.name || ""}
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
                                                    value={formData?.email || ""}
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
                                                    value={formData?.phone || ""}
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
                                                            value={formData?.address || ""}
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
                                                ) : (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={newAddress}
                                                            onChange={(e) => setNewAddress(e.target.value)}
                                                            rows="2"
                                                            placeholder="Enter your full address"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-md focus:ring-red-500 focus:border-red-500 dark:text-white"
                                                            required={addresses.length === 0}
                                                        ></textarea>
                                                        
                                                        {addresses.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddNewAddress}
                                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md text-sm"
                                                                >
                                                                    Save Address
                                                                </button>
                                                                
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowAddressForm(false)}
                                                                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-1.5 px-3 rounded-md text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Location Status */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Delivery Location
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={requestLocationPermission}
                                                        className="text-xs text-red-500 hover:text-red-600"
                                                    >
                                                        {userLocation.latitude === 0 && userLocation.longitude === 0
                                                            ? "Share Location"
                                                            : "Update Location"}
                                                    </button>
                                                </div>
                                                
                                                {locationError ? (
                                                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center">
                                                        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                                        <p>{locationError}</p>
                                                    </div>
                                                ) : userLocation.latitude === 0 && userLocation.longitude === 0 ? (
                                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300 flex items-center">
                                                        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                                        <p>Please share your location for delivery.</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <p>Location successfully captured</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )
                                }

                                {
                                    session?.user ? (
                                        <button
                                            type="submit"
                                            disabled={!checkSameRestaurant()}
                                            className={`w-full py-2 px-4 rounded-md transition-colors ${
                                                !checkSameRestaurant()
                                                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                            }`}
                                        >
                                            {`Checkout ${formatPrice(totalAmount + deliveryCharge)}`}
                                        </button>

                                    ) : (
                                        <Button className="bg-red-700 text-white flex text-md font-semibold from-mono mx-auto" variant={'default'} onClick={()=> router.push("/api/auth/signin")}>
                                            Sign In To Checkout
                                        </Button>
                                    )
                                }
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}