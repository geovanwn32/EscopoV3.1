import RciCalculator from "./RciCalculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RciPage() {
    return (
      <div className="space-y-6">
        <RciCalculator />
      </div>
    );
  }

