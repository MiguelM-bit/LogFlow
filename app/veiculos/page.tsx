import { redirect } from "next/navigation";

export default function VeiculosPage() {
  redirect("/cadastros?modulo=veiculo");
}
