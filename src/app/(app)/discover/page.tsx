import { getDiscoveryFeed } from "@/lib/data";
import { DiscoveryDeck } from "@/components/discovery-deck";

export const metadata = { title: "Discover · Friendlie" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { candidates } = await getDiscoveryFeed();

  return (
    <div className="py-2">
      <div className="mb-6 text-center md:hidden">
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Nearby people who share your interests
        </p>
      </div>
      <DiscoveryDeck initialCandidates={candidates} />
    </div>
  );
}
