import assert from 'node:assert/strict';

// In-memory stand-in for the parts of the MongoDB API that app.js uses.
export function createFakeDb(articles) {
  const docs = articles.map(a => structuredClone(a));

  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === 'object' && '$ne' in value) {
      const field = doc[key];
      if (field === undefined) return true;
      return Array.isArray(field) ? !field.includes(value.$ne) : field !== value.$ne;
    }
    return doc[key] === value;
  });

  const articlesCollection = {
    async findOne(filter) {
      const doc = docs.find(d => matches(d, filter));
      return doc ? structuredClone(doc) : null;
    },
    async findOneAndUpdate(filter, update) {
      // Yield first so simultaneous requests interleave as they could against a real database.
      await new Promise(resolve => setTimeout(resolve, 5));
      const doc = docs.find(d => matches(d, filter));
      if (!doc) return null;
      for (const [key, amount] of Object.entries(update.$inc ?? {})) doc[key] = (doc[key] ?? 0) + amount;
      for (const [key, value] of Object.entries(update.$push ?? {})) (doc[key] ??= []).push(value);
      return structuredClone(doc);
    },
  };

  return {
    docs,
    collection: name => {
      assert.equal(name, 'articles');
      return articlesCollection;
    },
  };
}
