export interface SamplePage {
  text: string;
  image: string;
}

export const getSamplePages = (childName: string = "Oliver"): SamplePage[] => [
  {
    text: `Once upon a time, in a land far, far away, lived a brave little explorer named ${childName}.`,
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=600&fit=crop",
  },
  {
    text: `${childName} loved to look at the stars. 'One day,' they whispered, 'I will touch the moon.'`,
    image:
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600&h=600&fit=crop",
  },
  {
    text: "With their shiny silver rocket ship, they zoomed past the fluffy white clouds.",
    image:
      "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&h=600&fit=crop",
  },
  {
    text: "They met a friendly alien who taught them that kindness is the universal language.",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=600&fit=crop",
  },
];
