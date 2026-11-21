export function branchMap(branch) {
 const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
 let url;
 try {
  url = new URL(branch.mapUrl || fallback);
  if (url.protocol !== "https:" || url.hostname !== "www.google.com" || !url.pathname.startsWith("/maps") || url.username || url.password) throw new Error("Invalid map URL");
 } catch { url = new URL(fallback); }
 const search = url.pathname.match(/\/maps\/search\/([^/]+)/);
 let searchTerm;
 try { searchTerm = search ? decodeURIComponent(search[1]) : null; } catch { searchTerm = null; }
 const query = url.searchParams.get("q") || url.searchParams.get("query") || searchTerm || branch.address;
 const embed = new URL("https://www.google.com/maps");
 embed.searchParams.set("q", query);
 embed.searchParams.set("z", "17");
 embed.searchParams.set("output", "embed");
 const center = url.pathname.match(/@(-?[\d.]+),(-?[\d.]+)/);
 if (center) embed.searchParams.set("ll", `${center[1]},${center[2]}`);
 return { href: url.href, embed: embed.href };
}
