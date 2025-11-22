import request from 'supertest';
import express from 'express';
import manifestRouter from '../routes/manifest.routes';

const app = express();
app.use(express.json());
app.use('/api', manifestRouter);

describe('POST /api/generate', () => {
  describe('successful requests', () => {
    it('should generate JSON manifest when format is json', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: {
            author: 'John Doe',
            title: 'Test Content'
          },
          formats: ['json']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('json');
      expect(response.body.json).toHaveProperty('version', '1.0.0');
      expect(response.body.json).toHaveProperty('hash');
      expect(response.body.json.payload).toEqual({
        author: 'John Doe',
        title: 'Test Content'
      });
    });

    it('should generate XML manifest when format is xml', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { author: 'Jane Smith' },
          formats: ['xml']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('xml');
      expect(response.body.xml).toContain('<manifest>');
      expect(response.body.xml).toContain('<author>Jane Smith</author>');
    });

    it('should generate both JSON and XML when both formats requested', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { test: 'data' },
          formats: ['json', 'xml']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('json');
      expect(response.body).toHaveProperty('xml');
    });

    it('should handle empty data object', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: {},
          formats: ['json']
        });

      expect(response.status).toBe(200);
      expect(response.body.json.payload).toEqual({});
    });

    it('should handle various data types in payload', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: {
            string: 'text',
            number: 42,
            boolean: true,
            nullValue: null
          },
          formats: ['json']
        });

      expect(response.status).toBe(200);
      expect(response.body.json.payload).toEqual({
        string: 'text',
        number: 42,
        boolean: true,
        nullValue: null
      });
    });
  });

  describe('validation errors', () => {
    it('should return 400 when data is missing', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          formats: ['json']
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('data');
    });

    it('should return 400 when data is not an object', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: 'not an object',
          formats: ['json']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('data');
    });

    it('should return 400 when formats is missing', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { test: 'data' }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('formats');
    });

    it('should return 400 when formats is not an array', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { test: 'data' },
          formats: 'json'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('formats');
    });

    it('should return 400 when data is null', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: null,
          formats: ['json']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('data');
    });

    it('should return 400 when data is an array', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: ['not', 'an', 'object'],
          formats: ['json']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('data');
    });
  });

  describe('edge cases', () => {
    it('should return 400 for empty formats array', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { test: 'data' },
          formats: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('formats');
    });

    it('should ignore invalid format values', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          data: { test: 'data' },
          formats: ['invalid', 'json']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('json');
      expect(response.body).not.toHaveProperty('invalid');
    });

    it('should generate consistent hashes for same data', async () => {
      const testData = { author: 'Test', title: 'Consistency' };

      const response1 = await request(app)
        .post('/api/generate')
        .send({ data: testData, formats: ['json'] });

      const response2 = await request(app)
        .post('/api/generate')
        .send({ data: testData, formats: ['json'] });

      expect(response1.body.json.hash).toBe(response2.body.json.hash);
    });
  });
});