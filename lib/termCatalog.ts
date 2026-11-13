import type { ProjectsFile } from "./schema";

export type TermKind = "technologies" | "tools";
export type TermOption = { name: string; category: string; description: string };

export const TERM_CATEGORIES: Record<TermKind, string[]> = {
  technologies: [
    "Web a frontend",
    "Data a analytika",
    "AI a automatizace",
    "Hosting a provoz",
    "Infrastruktura a systémy",
    "Rozhraní a design",
    "Typ a funkce aplikace",
    "Multimédia",
    "Ostatní"
  ],
  tools: [
    "AI asistenti",
    "Vývojová prostředí",
    "Datové platformy",
    "Hosting a správa",
    "Ostatní"
  ]
};

export function getTermCatalog(data: ProjectsFile, kind: TermKind): TermOption[] {
  const names = new Set([
    ...Object.keys(data.termDescriptions[kind]),
    ...Object.keys(data.termCategories[kind]),
    ...data.projects.flatMap((project) => project[kind])
  ]);

  return [...names].map((name) => ({
    name,
    category: data.termCategories[kind][name] ?? "Ostatní",
    description: data.termDescriptions[kind][name] ?? ""
  })).sort((a, b) => {
    const first = TERM_CATEGORIES[kind].indexOf(a.category);
    const second = TERM_CATEGORIES[kind].indexOf(b.category);
    return (first < 0 ? 99 : first) - (second < 0 ? 99 : second) ||
      a.name.localeCompare(b.name, "cs", { sensitivity: "base" });
  });
}

export function addTermToCatalog(
  data: ProjectsFile, kind: TermKind, rawName: string, category: string, rawDescription: string
): ProjectsFile {
  const name = rawName.trim().replace(/\s+/g, " ");
  const description = rawDescription.trim();
  if (!name || name.length > 80) throw new Error("Název musí mít 1 až 80 znaků.");
  if (!description || description.length > 500) throw new Error("Popis musí mít 1 až 500 znaků.");
  if (!TERM_CATEGORIES[kind].includes(category)) throw new Error("Vyber platnou kategorii.");
  const exists = getTermCatalog(data, kind).some((term) => term.name.toLocaleLowerCase("cs") === name.toLocaleLowerCase("cs"));
  if (exists) throw new Error("Položka s tímto názvem už v katalogu existuje.");

  return {
    ...data,
    termDescriptions: {
      ...data.termDescriptions,
      [kind]: { ...data.termDescriptions[kind], [name]: description }
    },
    termCategories: {
      ...data.termCategories,
      [kind]: { ...data.termCategories[kind], [name]: category }
    }
  };
}
