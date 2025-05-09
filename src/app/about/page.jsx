import { PageLayout } from "@/components/layout/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { satisfy } from "@/app/fonts";

export default function About() {
    return(
        <PageLayout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6 text-center">About Bites</h1>
                <Separator className="mb-8" />
                
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="about">About Us</TabsTrigger>
                        <TabsTrigger value="terms"><span className="hidden sm:block">Terms & Conditions</span> <span className="block sm:hidden">T & C</span></TabsTrigger>
                        <TabsTrigger value="policy"><span className="hidden sm:block">Policy Guidelines</span> <span className="block sm:hidden">Policies</span></TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="space-y-6">
                        <Card>
                            <div className="flex justify-center py-6">
                                <div className={`${satisfy.className} text-4xl font-bold text-red-500`}>
                                    Bites
                                </div>
                            </div>
                            <CardContent className="pt-6">
                                <p className="mb-4 text-lg">Welcome to Bites — your local go-to for fast and reliable food delivery.</p>
                                <p className="mb-4">We specialize in delivering delicious meals from your favorite local restaurants within a 5km radius. Whether you're at home, work, or just relaxing with friends, Bites brings hot and fresh food straight to your doorstep.</p>
                                <p className="mb-4">We believe in serving the community by connecting hungry customers with the best nearby eateries. Our platform is built for simplicity, speed, and satisfaction — helping you skip the lines and enjoy great meals effortlessly.</p>
                                <p className="mb-4">Founded in 2025, Bites started with a simple mission: make local food more accessible to everyone. Our team of passionate foodies and tech enthusiasts work tirelessly to ensure your ordering experience is seamless from start to finish.</p>
                                <p className="mb-4">What sets us apart is our commitment to supporting local businesses. We partner exclusively with independent restaurants and family-owned eateries in your neighborhood, helping them reach more customers while providing you with authentic, quality meals.</p>
                                <p>Join thousands of satisfied customers who trust Bites for their daily cravings, special occasions, and everything in between. Your next delicious meal is just a few taps away!</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="terms" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Terms and Conditions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p>By using Bites, you agree to the following terms:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><span className="font-medium">Service Area:</span> Deliveries are limited to a 5km radius from the user's selected delivery location. Orders beyond this range are not supported.</li>
                                    <li><span className="font-medium">Order Acceptance:</span> All orders are subject to availability and acceptance by the restaurant. Bites reserves the right to cancel orders in case of unforeseen circumstances.</li>
                                    <li><span className="font-medium">Delivery Time:</span> While we aim to deliver your food quickly, delivery times may vary due to traffic, weather, or restaurant delays.</li>
                                    <li><span className="font-medium">Account Responsibility:</span> Users are responsible for providing accurate delivery details. Any failed deliveries due to incorrect addresses or contact info will not be refunded.</li>
                                    <li><span className="font-medium">Conduct:</span> Abusive behavior or misuse of the service may result in account restriction or termination.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="policy" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery & Cancellation Policy</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <h3 className="font-semibold text-lg">Delivery Policy</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>We deliver only food items from restaurants — no groceries or other goods.</li>
                                    <li>Deliveries are available only within a 5km radius of the chosen location.</li>
                                    <li>Orders must include valid contact details. If you are unreachable at the time of delivery, the order may be marked as failed.</li>
                                </ul>
                                
                                <h3 className="font-semibold text-lg mt-4">Cancellation & Refund Policy</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Currently, we do not offer any cancellation or refund options.</li>
                                    <li>Once an order is placed, it is considered final and non-refundable.</li>
                                    <li>Please double-check your cart, delivery address, and contact number before placing your order.</li>
                                </ul>
                                
                                <h3 className="font-semibold text-lg mt-4">Privacy & Data Policy</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Bites collects only essential personal information (like name, contact number, and address) to fulfill your order.</li>
                                    <li>We do not share your data with third parties, except with restaurants and delivery partners involved in your specific order.</li>
                                    <li>Your data is stored securely and is used solely for operational purposes.</li>
                                </ul>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Us</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4">For support, feedback, or questions, please feel free to reach out to us:</p>
                                <div className="space-y-2 flex flex-col">
                                    <Link target="_blank" href="https://wa.me/918999201431" className="font-medium">📞 Phone: +91 8999201431</Link>
                                    <Link target="_blank" href="mailto:ex.firsttbite@gmail.com" className="font-medium">📧 Email: ex.firsttbite@gmail.com</Link>
                                </div>
                                <p className="mt-4">We're here to help and appreciate your trust in Bites.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    )
}