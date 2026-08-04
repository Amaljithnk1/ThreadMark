"use client";
import {OnboardingChat} from "@/components/onboarding-chat";import {RequireRole} from "@/components/require-role";export default function SupplierOnboarding(){return <RequireRole role="supplier"><OnboardingChat kind="supplier"/></RequireRole>}
