"use client";
import {OnboardingChat} from "@/components/onboarding-chat";import {RequireRole} from "@/components/require-role";export default function BuyerOnboarding(){return <RequireRole role="buyer"><OnboardingChat kind="buyer"/></RequireRole>}
