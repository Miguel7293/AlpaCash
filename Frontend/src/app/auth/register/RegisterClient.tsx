"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleSelector, type RoleId } from "@/components/auth/RoleSelector";
import { Register } from "@/components/auth/Register";

const VALID_ROLE_IDS: RoleId[] = ["producer", "buyer", "financial"];

function parseRoleParam(value: string | null): RoleId | undefined {
  return VALID_ROLE_IDS.includes(value as RoleId) ? (value as RoleId) : undefined;
}

/**
 * Landing/login CTAs arrive here with ?role=producer|buyer|financial already
 * decided — skip the RoleSelector step and drop straight into the form.
 */
export function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = parseRoleParam(searchParams.get("role"));

  const [step, setStep] = useState<"role" | "form">(initialRole ? "form" : "role");
  const [role, setRole] = useState<RoleId | undefined>(initialRole);

  if (step === "form") {
    return (
      <Register
        initialRole={role}
        onBack={() => setStep("role")}
        onLogin={() => router.push("/auth/login")}
      />
    );
  }

  return (
    <RoleSelector
      onBack={() => router.push("/")}
      onPick={(r) => {
        setRole(r);
        setStep("form");
      }}
    />
  );
}
