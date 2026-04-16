import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PlanDetailClient from "./PlanDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getBaseUrl(headerList: Headers): string {
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = headerList.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  if (host) {
    return `${forwardedProto ?? (host.includes("localhost") ? "http" : "https")}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

async function getPlan(id: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/plans/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const headerList = await headers();
  const baseUrl = getBaseUrl(headerList);
  const plan = await getPlan(id, baseUrl);

  if (!plan) {
    return {
      title: "Plan not found",
      description: "This plan is unavailable.",
    };
  }

  const ogImageUrl = new URL(`/plans/${id}/opengraph-image`, baseUrl).toString();

  return {
    title: `${plan.title} | Join now`,
    description: plan.description || "Join this plan",
    openGraph: {
      title: plan.title,
      description: plan.description || "Join this plan",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: plan.title,
      description: plan.description || "Join this plan",
      images: [ogImageUrl],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const headerList = await headers();
  const baseUrl = getBaseUrl(headerList);
  const plan = await getPlan(id, baseUrl);

  if (!plan) {
    notFound();
  }

  return <PlanDetailClient initialPlan={plan} />;
}
