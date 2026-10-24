/** Questions answered on the landing page. Server-rendered and mirrored in its FAQPage JSON-LD, so search and AI answer engines can read and cite them. */
export const HOME_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How early should I get to the airport?",
    a: "Airlines commonly recommend arriving 2 hours before a domestic flight and 3 hours before an international one (Delta's guidance, for example). The time you actually need depends on your airport, terminal, the hour you fly, whether you're checking a bag and how far your gate is. Leave By works that out for your specific flight.",
  },
  {
    q: "How does Leave By work?",
    a: "Type your flight number and pick your departure from the list. Add where you're starting from. Leave By checks live traffic, the typical security wait for your terminal and hour, your airline's bag-drop and boarding times, airport alerts and the weather, then gives you the exact minute to walk out the door.",
  },
  {
    q: "Does it work for international flights?",
    a: "Yes. When your trip crosses a border, Leave By adds passport control where it applies: exit checks leaving the Schengen area (including the EU's new Entry/Exit System) and US preclearance at airports like Dublin and Toronto. It also allows for the earlier boarding of international flights.",
  },
  {
    q: "Is Leave By free?",
    a: "Yes. It's free and you don't need an account.",
  },
  {
    q: "Is the leave time a guarantee?",
    a: "No. It's an estimate built from live and typical data. Always follow your airline's check-in, bag-drop and boarding deadlines.",
  },
];
