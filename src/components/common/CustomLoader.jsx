import { Spinner} from "@/components/ui/spinner"

export default function CustomLoader({title}) {
    return (
        <div className="flex text-muted-foreground items-center gap-3 px-3 py-2 w-fit bg-muted rounded-lg border border-gray-700">
            <Spinner />
            <p className="text-xs">
                Loading {title || ""}...
            </p>
        </div>
    )
}