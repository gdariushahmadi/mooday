// It's possible that the pg_tap `throws_ok` does not catch the exception if the exception wasn't from RLS but from some other trigger that was added later.
// Or wait, if `caught: no exception` was reported, it means NO EXCEPTION AT ALL was thrown! Which means the insert into audit_log SUCCEEDED.
// Why did the insert succeed?
// Let's create a minimal test script using psql to see why the insert succeeds.
