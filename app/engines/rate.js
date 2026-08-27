/* ============================================================================
   RATE LIMITING — a sliding window kept in the database so it survives a
   restart and cannot be defeated by reconnecting.
   ========================================================================== */
export function hit(db, bucket, limit, windowMs) {
  const cut = Date.now() - windowMs;
  db.prepare('DELETE FROM rate_events WHERE at < ?').run(cut);
  const n = db.prepare('SELECT COUNT(*) n FROM rate_events WHERE bucket=? AND at>=?').get(bucket, cut).n;
  if (n >= limit) return false;
  db.prepare('INSERT INTO rate_events (bucket,at) VALUES (?,?)').run(bucket, Date.now());
  return true;
}
export function count(db, bucket, windowMs) {
  const cut = Date.now() - windowMs;
  return db.prepare('SELECT COUNT(*) n FROM rate_events WHERE bucket=? AND at>=?').get(bucket, cut).n;
}
