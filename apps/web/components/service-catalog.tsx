'use client';

import { useEffect, useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  formatCurrencyTwd,
  isApiSuccess,
  type ServiceSummary,
} from '@ai-gym/shared';

import { apiFetch } from '../lib/api';

export function ServiceCatalog() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await apiFetch<{ services: ServiceSummary[] }>(
          `/api/services?businessSlug=${DEFAULT_BUSINESS_SLUG}`,
        );

        if (isApiSuccess(response)) {
          setServices(response.data.services);
          return;
        }

        setError(response.error);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '載入服務失敗');
      }
    }

    void loadServices();
  }, []);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Services</span>
          <h2>目前 demo 課程</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="service-grid">
        {services.map((service) => (
          <article key={service.id} className="service-card">
            <h3>{service.name}</h3>
            <p>{service.description ?? '尚未提供描述'}</p>
            <dl className="meta-list">
              <div>
                <dt>時長</dt>
                <dd>{service.durationMinutes} 分鐘</dd>
              </div>
              <div>
                <dt>價格</dt>
                <dd>{formatCurrencyTwd(service.price)}</dd>
              </div>
            </dl>
          </article>
        ))}

        {services.length === 0 && !error ? (
          <p className="muted-text">正在載入服務資料...</p>
        ) : null}
      </div>
    </section>
  );
}
