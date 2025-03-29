import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { useEffect} from "react";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";
  
//   const invoices = [
//     {
//       invoice: "INV001",
//       paymentStatus: "Paid",
//       totalAmount: "$250.00",
//       paymentMethod: "Credit Card",
//     },
//     {
//       invoice: "INV002",
//       paymentStatus: "Pending",
//       totalAmount: "$150.00",
//       paymentMethod: "PayPal",
//     },
//     {
//       invoice: "INV003",
//       paymentStatus: "Unpaid",
//       totalAmount: "$350.00",
//       paymentMethod: "Bank Transfer",
//     },
//     {
//       invoice: "INV004",
//       paymentStatus: "Paid",
//       totalAmount: "$450.00",
//       paymentMethod: "Credit Card",
//     },
//     {
//       invoice: "INV005",
//       paymentStatus: "Paid",
//       totalAmount: "$550.00",
//       paymentMethod: "PayPal",
//     },
//     {
//       invoice: "INV006",
//       paymentStatus: "Pending",
//       totalAmount: "$200.00",
//       paymentMethod: "Bank Transfer",
//     },
//     {
//       invoice: "INV007",
//       paymentStatus: "Unpaid",
//       totalAmount: "$300.00",
//       paymentMethod: "Credit Card",
//     },
//   ]
  
  export function CartProductTable({cartItems, handleRemoveItem, handleAddItem, totalAmount, setTotalAmount}) {
    useEffect(() => {
        const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        if (total !== totalAmount) {
            setTotalAmount(total);
        }
    }, [cartItems, totalAmount, setTotalAmount]);

    return (
      <Table>
        <TableCaption>Items In Cart.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead className="text-center">Price</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="row-gap-2">
          {cartItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-nowrap overflow-ellipsis">{item.name}</TableCell>
              <TableCell className="text-center">{item.price}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-3">
                    <Button size="icon" className="rounded-full bg-black text-white border border-white hover:border-red-400 hover:text-red-400 p-1" onClick={() => handleRemoveItem(item.id)}>
                        <MinusIcon className="w-5 h-5" />
                    </Button>
                    {item.quantity}
                    <Button size="icon" className="rounded-full bg-black text-white border border-white hover:border-green-400 hover:text-green-400 p-1" onClick={() => handleAddItem(item.id)}>
                        <PlusIcon className="w-5 h-5" />
                    </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">{item.price * item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">{totalAmount}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
  }
  