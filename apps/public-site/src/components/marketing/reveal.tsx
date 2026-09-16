'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * تلاشي + انزلاق للأعلى عند دخول العنصر نطاق الرؤية — بلا أي مكتبة
 * خارجية (public-site ليس فيه framer-motion ولا مشابه). `IntersectionObserver`
 * يضيف الحالة مرة واحدة فقط (`triggerOnce`)، فلا حركة متكررة عند
 * التمرير ذهابًا وإيابًا.
 *
 * **تحسين تدريجي حقيقي، لا مجرّد حركة زخرفية**: الحالة الافتراضية
 * (قبل تركيب المكوّن، أي HTML الذي يُرسَل من الخادم فعليًا) هي "ظاهر
 * بالكامل" — فمحتوى الصفحة التسويقية يبقى مقروءًا حتى لو تعطّل
 * JavaScript كليًا (شبكة بطيئة، مانع إعلانات يكسر Hydration، إلخ)، بدل
 * الاعتماد على IntersectionObserver لإظهار المحتوى أساسًا. فقط بعد تأكد
 * التركيب فعليًا (useEffect) يُقرَّر إن كان العنصر أسفل الشاشة فعلًا —
 * عندها فقط يُخفى مؤقتًا ليُعاد إظهاره بحركة عند وصول التمرير إليه.
 */
export function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'visible' | 'pending' | 'entering'>('visible');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const alreadyInView = node.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (alreadyInView) return;

    setState('pending');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('entering');
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden = state === 'pending';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${hidden ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'} ${className}`}
    >
      {children}
    </div>
  );
}
