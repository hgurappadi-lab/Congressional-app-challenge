// Single source of truth for the app's primary navigation links — shared
// between /home's hero nav and SiteHeader (every other page). Keeping one
// list means the two never drift apart.
export const NAV_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/map", label: "Explore" },
  { href: "/map?mode=find-dish", label: "Find a Dish" },
  { href: "/favorites", label: "Favorites" },
];
