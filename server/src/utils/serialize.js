function serializeDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  return obj;
}

function serializeMany(docs) {
  return (docs || []).map(serializeDoc);
}

module.exports = { serializeDoc, serializeMany };
