import { ManifestGeneratorService } from './manifestGeneratorService';
import { ManifestPayload } from '../types/manifest';

describe('ManifestGeneratorService', () => {
  describe('generateManifest', () => {
    it('should generate a valid manifest with all required fields', () => {
      const testData: ManifestPayload = {
        author: 'John Doe',
        title: 'Test Content',
        category: 'Art'
      };

      const manifest = ManifestGeneratorService.generateManifest(testData);

      expect(manifest).toHaveProperty('version');
      expect(manifest).toHaveProperty('timestamp');
      expect(manifest).toHaveProperty('hash');
      expect(manifest).toHaveProperty('payload');
      expect(manifest).toHaveProperty('generatedBy');
    });

    it('should set version to 1.0.0', () => {
      const testData = { key: 'value' };
      const manifest = ManifestGeneratorService.generateManifest(testData);

      expect(manifest.version).toBe('1.0.0');
    });

    it('should include correct generator string', () => {
      const testData = { key: 'value' };
      const manifest = ManifestGeneratorService.generateManifest(testData);

      expect(manifest.generator).toBe('VeriLens Manifest Engine (Key–Value Mode)');
    });

    it('should generate timestamp close to current time', () => {
      const before = Date.now();
      const manifest = ManifestGeneratorService.generateManifest({ test: 'data' });
      const after = Date.now();

      expect(manifest.timestamp).toBeGreaterThanOrEqual(before);
      expect(manifest.timestamp).toBeLessThanOrEqual(after);
    });

    it('should preserve payload data exactly', () => {
      const testData: ManifestPayload = {
        author: 'Jane Smith',
        title: 'My Artwork',
        verified: true,
        count: 42,
        nullable: null
      };

      const manifest = ManifestGeneratorService.generateManifest(testData);

      expect(manifest.payload).toEqual(testData);
    });

    it('should generate a 64-character hex hash', () => {
      const testData = { test: 'data' };
      const manifest = ManifestGeneratorService.generateManifest(testData);

      expect(manifest.contentHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate deterministic hashes for identical data', () => {
      const testData = { author: 'John', title: 'Test' };
      
      const manifest1 = ManifestGeneratorService.generateManifest(testData);
      const manifest2 = ManifestGeneratorService.generateManifest(testData);

      expect(manifest1.contentHash).toBe(manifest2.contentHash);
    });

    it('should generate different hashes for different data', () => {
      const data1 = { author: 'John' };
      const data2 = { author: 'Jane' };

      const manifest1 = ManifestGeneratorService.generateManifest(data1);
      const manifest2 = ManifestGeneratorService.generateManifest(data2);

      expect(manifest1.contentHash).not.toBe(manifest2.contentHash);
    });

    it('should handle empty objects', () => {
      const manifest = ManifestGeneratorService.generateManifest({});

      expect(manifest.payload).toEqual({});
      expect(manifest.contentHash).toBeDefined();
    });

    it('should handle complex nested data', () => {
      const complexData = {
        simple: 'string',
        number: 123,
        boolean: true,
        nullValue: null
      };

      const manifest = ManifestGeneratorService.generateManifest(complexData);

      expect(manifest.payload).toEqual(complexData);
      expect(manifest.contentHash).toBeDefined();
    });
  });

  describe('toXML', () => {
    const sampleManifest = {
      version: '1.0.0',
      timestamp: 1732131212323,
      contentHash: '3f3458a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0',
      payload: {
        author: 'John Doe',
        title: 'Test Content'
      },
      generator: 'VeriLens Manifest Engine (Key–Value Mode)'
    };

    it('should generate valid XML string', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<manifest>');
      expect(xml).toContain('</manifest>');
    });

    it('should include version in XML', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<version>1.0.0</version>');
    });

    it('should include timestamp in XML', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<timestamp>1732131212323</timestamp>');
    });

    it('should include contentHash in XML', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<contentHash>');
      expect(xml).toContain(sampleManifest.contentHash);
    });

    it('should include payload data in XML', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<author>John Doe</author>');
      expect(xml).toContain('<title>Test Content</title>');
    });

    it('should include generator in XML', () => {
      const xml = ManifestGeneratorService.toXML(sampleManifest);

      expect(xml).toContain('<generator>VeriLens Manifest Engine (Key–Value Mode)</generator>');
    });

    it('should handle empty payload in XML', () => {
      const manifestWithEmptyPayload = {
        ...sampleManifest,
        payload: {}
      };

      const xml = ManifestGeneratorService.toXML(manifestWithEmptyPayload);

      expect(xml).toContain('<manifest>');
      expect(xml).toContain('<payload/>');
    });
  });
});