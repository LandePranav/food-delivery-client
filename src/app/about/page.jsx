import { PageLayout } from "@/components/layout/page-layout";

export default function About() {
    return(
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">About Us</h1>
                <p className="mb-4">Welcome to our food delivery service! We are dedicated to bringing you the best culinary experiences right to your doorstep.</p>
                <p className="mb-4">Our mission is to connect food lovers with their favorite restaurants and dishes, making delicious meals accessible to everyone.</p>
                <p className="mb-4">We partner with the finest local restaurants and chefs to ensure quality and variety in our offerings.</p>
                <p>Thank you for choosing our service for your dining needs!</p>
            </div>
        </PageLayout>
    )
}