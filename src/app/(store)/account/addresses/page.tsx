import { AddressManager } from "@/components/store/AddressManager";

export const metadata = { title: "Saved addresses" };
export default function AddressesPage() { return <><h1 className="mb-6 text-3xl">Saved addresses</h1><AddressManager /></>; }
