"use client"
import { useContext, useEffect, useState } from "react";
// import {jet} from "../fonts.js"
import { IoSearch } from "react-icons/io5";
import { context } from "@/context/contextProvider.jsx";
import foodProducts from "@/lib/constants";
import Card from "@/components/home/card.jsx";
import api from "@/lib/axios.js";


export default function Page() {
    const [searchText,setSearchText] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);

    useEffect(()=>{
        const filteredList = allProducts?.filter((item)=> item.name.toLowerCase().includes(searchText.toLowerCase()));
        setFiltered(filteredList);
        if(searchText === ""){
            setFiltered(allProducts);
        }
    },[searchText]);

    // useEffect(()=>{
    //     setFiltered(foodProducts);
    // },[]);

    useEffect(()=>{
        const products = async()=>{
            const response = await api.get("/products");
            setAllProducts(response.data);
            setFiltered(response.data);
        }
        products();
    },[]);

    return(
        <div className="w-full h-full">
            <div className="w-full flex gap-2 pb-1 border-b border-[#999999] items-center">
                <IoSearch className="w-6 h-6" />
                <input 
                    value={searchText || ""}
                    onChange={(e)=>setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent cursor-pointer focus:outline-none focus:ring-0 px-3 py-1"
                />
            </div>
            <div className="w-full h-full py-6">
                <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-col-3 gap-6 py-3">
                    {filtered.map((item)=>(
                        <div key={item.id} className="h-[325px]">
                            <Card id={item.id} category={item.category} image={item.image} name={item.name} description={item.description} price={item.price} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}