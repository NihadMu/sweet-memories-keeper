export type Lesson = {
  id: string;
  title: string;
  durationSeconds: number;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export const COURSE_TITLE = "Meta Course";

export const MODULES: Module[] = [
  {
    id: "satis-toplantisi",
    title: "Satış Toplantısı",
    description: "Toplantı öncesi hazırlıktan ödeme almaya kadar satış süreci.",
    lessons: [
      { id: "1v9uEbaYI8SqHI4m0tYrcm5yIm2XBi05n", title: "Toplantı Öncesi Hazırlık", durationSeconds: 434 },
      { id: "15HBZj_zEGy9sssUB9VkQ2iPYhIUtTwow", title: "Sorun Tespiti ve Konumlandırma", durationSeconds: 647 },
      { id: "1V6FBEKlVwbg-GDjPIqk1hvg16v9FoIrJ", title: "Toplantı Sunumu", durationSeconds: 580 },
      { id: "1Yld8PfiosxJbn5nXtOrDpXGLypHpIub0", title: "Hizmetini Nasıl Pazarlarsın", durationSeconds: 316 },
      { id: "1oVX80VjkHL9kc7HLlGZF_SlxJLlGI4gV", title: "Ödeme Alma", durationSeconds: 483 },
    ],
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Yeni müşteriyi sisteme almak için gereken araçlar ve akış.",
    lessons: [
      { id: "1SDk8cjZhpiE_jMmCu6LWAU0HgYjrKsi7", title: "Onboarding Nasıl Görünür", durationSeconds: 708 },
      { id: "1-5OyN0raAKxozXrYz6qpcRsTQJCTupif", title: "Drive Kullanımı", durationSeconds: 314 },
      { id: "1Znnbj7OqRxEELMz6X-UvBozRTNGtORbk", title: "Miro Kullanımı", durationSeconds: 253 },
      { id: "15cq9Rqpo0tqM4wBb21eNHacS2y_3Jp-w", title: "MTS", durationSeconds: 442 },
    ],
  },
  {
    id: "hizmet-teslimati",
    title: "Hizmet Teslimatı",
    description: "Meta reklamlarını kurma, yönetme ve ölçeklendirme.",
    lessons: [
      { id: "1ir9oczeYKmQvWL3bfM7IeZY5a-v5EsDp", title: "Meta Paneli", durationSeconds: 344 },
      { id: "1Xu5o1oIL9hLzJj1apvA8_rQj6FVEkgxq", title: "Facebook Business Manager", durationSeconds: 323 },
      { id: "1zDtQ1CKY4gIuEi8xzgWQAxcQohfMBlXz", title: "Meta Sözlük", durationSeconds: 599 },
      { id: "1VmoXmKYlZWlLst3UFcts6owvC-tNddkV", title: "Hedef Kitle Oluşturma", durationSeconds: 755 },
      { id: "1PfsS8Bguad3ZG1Oab-y389ppK7H_251V", title: "Funnel Nedir", durationSeconds: 699 },
      { id: "1WTndBXX9k7ZmhaMUBxc1bocn2XTdiyi0", title: "Kreatif", durationSeconds: 859 },
      { id: "1IX-z0wt0Hic-pp-DtZwrlMam32qfDYmD", title: "E-Ticaret Reklamları", durationSeconds: 1002 },
      { id: "19GVHZPqLj0Opb05uKd56F3p4IAVRYhaW", title: "Retargeting", durationSeconds: 494 },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })),
);

export const LESSON_IDS = new Set(ALL_LESSONS.map((l) => l.id));

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
