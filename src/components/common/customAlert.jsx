import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function CustomAlert({title,message, type}) {
    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 px-10 bg-black/50 backdrop-blur-sm">
            <div className="w-full md:w-1/2 h-full flex items-center justify-center mx-auto">
                <Alert variant={type}>
                    <AlertTitle className="text-lg font-bold">{title}</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            </div>
        </div>
    )
}