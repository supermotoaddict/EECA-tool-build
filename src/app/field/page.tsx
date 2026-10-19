import type { Metadata } from "next";
import FieldApp from "@/components/field/FieldApp";

export const metadata: Metadata = {
  title: "Premier Field — site routes & visit log",
  description:
    "Track streets you have driven and log construction site visits for Premier Solutions insulation quotes.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Premier Field",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function FieldPage() {
  return <FieldApp />;
}
