"use client"

import { useState, useEffect } from "react";
import { createContext } from "react";

export const context = createContext();

// Haversine formula to calculate distance between two GPS points in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const toRad = value => (value * Math.PI) / 180;
    
    const R = 6371; // Radius of the earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return distance;
};

export default function ContextProvider({children}) {
    const [cartItems, setCartItems] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);

    // Load cart items from localStorage on initial load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCartItems = localStorage.getItem('cartItems');
            if (savedCartItems) {
                try {
                    setCartItems(JSON.parse(savedCartItems));
                } catch (error) {
                    console.error("Error parsing saved cart items:", error);
                }
            }
        }
    }, []);

    // Save cart items to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems]);

    useEffect(() => {
        // Get user's current location
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    setLocationLoading(false);
                    console.log("User location obtained:", latitude, longitude);
                    
                    // Store in localStorage for persistence
                    localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationError(error.message);
                    setLocationLoading(false);
                    
                    // Try to get location from localStorage if available
                    const storedLocation = localStorage.getItem('userLocation');
                    if (storedLocation) {
                        setUserLocation(JSON.parse(storedLocation));
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            setLocationError("Geolocation is not supported by this browser.");
            setLocationLoading(false);
        }
    }, []);

    // Function to add item to cart
    const addToCart = (item) => {
        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(cartItem => cartItem.id === item.id);
            
            if (existingItemIndex !== -1) {
                // Item exists, update quantity
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: (updatedItems[existingItemIndex].quantity || 1) + 1
                };
                return updatedItems;
            } else {
                // Item doesn't exist, add new item with quantity 1
                return [...prevItems, { ...item, quantity: 1 }];
            }
        });
    };

    // Function to remove item from cart
    const removeFromCart = (id) => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.id === id);
            
            if (existingItemIndex === -1) return prevItems;
            
            const item = prevItems[existingItemIndex];
            const updatedItems = [...prevItems];
            
            if (item.quantity > 1) {
                // Decrease quantity if more than 1
                updatedItems[existingItemIndex] = {
                    ...item,
                    quantity: item.quantity - 1
                };
            } else {
                // Remove item if quantity is 1
                updatedItems.splice(existingItemIndex, 1);
            }
            
            return updatedItems;
        });
    };

    // Function to completely remove an item from cart
    const removeItemCompletely = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    // Function to calculate cart total
    const calculateCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    };

    // Function to calculate distance between user and a given location
    const getDistanceFromUser = (sellerLocation) => {
        if (!userLocation || !sellerLocation) return null;
        
        let sellerLatitude, sellerLongitude;
        
        // Handle different formats of location data
        if (typeof sellerLocation === 'object') {
            if (sellerLocation.hasOwnProperty('latitude') && sellerLocation.hasOwnProperty('longitude')) {
                sellerLatitude = sellerLocation.latitude;
                sellerLongitude = sellerLocation.longitude;
            } else if (sellerLocation.hasOwnProperty('lat') && sellerLocation.hasOwnProperty('lng')) {
                sellerLatitude = sellerLocation.lat;
                sellerLongitude = sellerLocation.lng;
            } else if (Array.isArray(sellerLocation) && sellerLocation.length >= 2) {
                [sellerLatitude, sellerLongitude] = sellerLocation;
            }
        }
        
        return calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            sellerLatitude,
            sellerLongitude
        );
    };

    return(
        <context.Provider value={{
            cartItems, 
            setCartItems,
            addToCart,
            removeFromCart,
            removeItemCompletely,
            calculateCartTotal,
            userLocation, 
            locationError, 
            locationLoading,
            getDistanceFromUser
        }}>
            {children}
        </context.Provider>
    );
}