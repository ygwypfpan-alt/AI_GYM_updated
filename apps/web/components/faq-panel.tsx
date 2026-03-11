'use client';

import { useEffect, useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  isApiSuccess,
  type FaqItemDto,
} from '../lib/shared';

import { apiFetch } from '../lib/api';

export function FaqPanel() {
  const [items, setItems] = useState<FaqItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFaqItems() {
      try {
        const response = await apiFetch<{ items: FaqItemDto[] }>(
          `/api/faqs?businessSlug=${DEFAULT_BUSINESS_SLUG}&limit=6`,
        );

        if (isApiSuccess(response)) {
          setItems(response.data.items);
          return;
        }

        setError(response.error);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '載入 FAQ 失敗');
      }
    }

    void loadFaqItems();
  }, []);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2>熱門 FAQ</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="faq-list">
        {items.map((item) => (
          <article key={item.id} className="faq-card">
            <div className="chip-row">
              {(item.keywords ?? []).slice(0, 4).map((keyword) => (
                <span key={keyword} className="chip">
                  {keyword}
                </span>
              ))}
            </div>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}

        {items.length === 0 && !error ? (
          <p className="muted-text">正在載入 FAQ...</p>
        ) : null}
      </div>
    </section>
  );
}
