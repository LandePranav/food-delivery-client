// import { jet, satisfy } from "./fonts";
"use client"
import Featured from "@/components/home/featured";
import Card from "@/components/home/card";
// import foodProducts from "@/lib/constants";
import { FaFireFlameCurved } from "react-icons/fa6";
import { useState, useEffect } from "react";
import api from "@/lib/axios";


export default function Home() {

  const [products, setProducts] = useState([]);

    useEffect(() => {
    const fetchProducts = async () => {
      const response = await api.get("/products");
      // console.log(response.data);
      if (response.status === 200) {
        // console.log(response.data);
        setProducts(response.data);
      } else {
        console.log("Error fetching products");
      }
    };
    fetchProducts();
  }, []);
  
  return (
    <div className={"w-full h-full"}>
      <Featured />
      <section className="w-full py-4">
        <p className="flex gap-2 items-center mb-5 border-l-4 border-white px-3">
          Trending
          <FaFireFlameCurved className="w-5 h-5 fill-red-500" />
        </p>
        <div className="w-full h-[325px] flex gap-5 py-3 overflow-x-auto">
          {products.map((item)=>(
              <div key={item.id} className="min-w-[230px] w-[230px]">
                <Card sellerId={item.sellerId} imageUrls={item.imageUrls} id={item.id} category={item.category} image={item.imageUrl} name={item.name} description={item.description} price={item.price} />
              </div>
          ))}
        </div>
      </section>
    </div>
  );
}