import assert from 'node:assert/strict';

// The values at a dotted path, looking inside arrays as MongoDB does:
// 'comments.postedBy' gives the postedBy of every comment.
function valuesAt(doc, path) {
  let values = [doc];
  for (const key of path.split('.')) {
    values = values.flatMap(value => (Array.isArray(value) ? value : [value]))
      .map(value => value?.[key])
      .filter(value => value !== undefined);
  }
  return values;
}

// In-memory stand-in for the parts of the MongoDB API that app.js and the scripts use.
export function createFakeDb(articles) {
  const docs = articles.map(a => structuredClone(a));

  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === 'object' && '$ne' in value) {
      const field = doc[key];
      if (field === undefined) return true;
      return Array.isArray(field) ? !field.includes(value.$ne) : field !== value.$ne;
    }
    if (value && typeof value === 'object' && '$regex' in value) {
      return valuesAt(doc, key).some(v => typeof v === 'string' && value.$regex.test(v));
    }
    return doc[key] === value;
  });

  const articlesCollection = {
    async findOne(filter) {
      const doc = docs.find(d => matches(d, filter));
      return doc ? structuredClone(doc) : null;
    },
    // Ignores the projection: callers only read the fields they asked for.
    find(filter) {
      return { toArray: async () => docs.filter(d => matches(d, filter)).map(d => structuredClone(d)) };
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
    // Supports $set on 'array.$[id].field', with an arrayFilters entry for that id.
    async updateMany(filter, update, { arrayFilters = [] } = {}) {
      const matched = docs.filter(d => matches(d, filter));
      for (const doc of matched) {
        for (const [path, value] of Object.entries(update.$set ?? {})) {
          const [, arrayField, id, field] = path.match(/^(\w+)\.\$\[(\w+)\]\.(\w+)$/) ?? assert.fail(`unsupported $set path ${path}`);
          const conditions = arrayFilters.find(f => Object.keys(f).every(key => key.startsWith(`${id}.`)))
            ?? assert.fail(`no arrayFilters entry for ${id}`);
          const elementFilter = Object.fromEntries(Object.entries(conditions).map(([key, condition]) => [key.slice(id.length + 1), condition]));
          for (const element of doc[arrayField] ?? []) {
            if (matches(element, elementFilter)) element[field] = value;
          }
        }
      }
      return { matchedCount: matched.length, modifiedCount: matched.length };
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
