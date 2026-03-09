import request from 'supertest';

import { createApp } from '../../apps/api/src/app.ts';
import { detectIntent } from '../../apps/api/src/lib/intent.ts';

describe('AI GYM API smoke tests', () => {
  it('returns health payload', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        ok: true,
        service: 'ai-gym-api',
      }),
    });
  });

  it('detects availability intent', () => {
    expect(detectIntent('今晚還有團體燃脂課嗎？')).toBe('AVAILABILITY');
    expect(detectIntent('我要真人協助')).toBe('HANDOFF');
  });
});
