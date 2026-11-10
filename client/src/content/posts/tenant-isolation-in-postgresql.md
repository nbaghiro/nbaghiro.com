title: Tenant isolation in PostgreSQL
date: 2026-11-10
about: Engineering
cover: /img/posts/tenant-isolation-in-postgresql-wide.webp
card: /img/posts/tenant-isolation-in-postgresql-card.webp
summary: How Lumischool carries family context through database transactions, applies row-level policies, and checks that migrations preserve the boundary, including the limits of a shared application role.

A tutor can belong to more than one family in Lumischool. Opening one family's page should not expose the other family's children, events, or saved work, even if a database query forgets a family filter.

That is the problem the database layer addresses with PostgreSQL row-level security. Each request's database work runs as a restricted application role inside a transaction carrying the selected family and signed-in user. Policies compare that context with the rows being read or written.

The implementation also has to answer questions around that boundary. Who chooses the family? What happens when a pooled connection is reused? Which rows are intentionally shared? How does a new table get its policy? Those details determine whether the boundary continues to hold as the application grows.

## Put context on the transaction

The application's main database entry point is `withFamily`. It accepts a scope and a callback, validates that the supplied IDs are UUIDs or null, opens a transaction, and sets three local values before calling the callback:

```sql
SELECT
  set_config('app.family', $1, true),
  set_config('app.user', $2, true),
  set_config('statement_timeout', $3, true);
```

The boolean argument is important. With `true`, `set_config` applies the setting only to the current transaction. A session-scoped value would live beyond one request on a reused connection. [PostgreSQL configuration functions](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET)

The code passes empty strings for absent IDs. The policy helper turns both missing settings and empty strings into SQL null:

```sql
SELECT nullif(current_setting('app.family', true), '')::uuid;
```

That avoids trying to cast an empty string to a UUID after a connection has previously used a custom setting. A comparison between a row's family and null does not authorize that row. Shared catalog content has a separate read policy, so an unscoped request can still read the catalog where intended.

The callback uses the transaction object it receives. If it throws, the transaction rolls back. The local scope ends with the transaction, whether the operation succeeds or fails. The configured statement timeout is local too, so the request has a limit on a long query or lock wait.

![Family context belongs to one transaction. After commit or rollback, the next transaction sets its own context before querying.](figure:tenant-transaction-scope)

This matters with a pool because a connection is reusable infrastructure. The current family is request state. Keeping them at different lifetimes avoids relying on every exit path to remember a manual reset.

## Check both the row being reached and the row being written

For an ordinary family-owned table, the generated policy has this shape:

```sql
CREATE POLICY kids_family ON kids
USING (family_id = (SELECT app_family()))
WITH CHECK (family_id = (SELECT app_family()));
```

In the local implementation, the migrations enable RLS and force it on the scoped tables. The policy describes which existing rows are reachable and which proposed row values are allowed. Both sides matter for an update that tries to move a row into another family.

A query such as `SELECT * FROM kids` can therefore return only the current family's rows under the application role. An insert that names another family is rejected. Adding explicit family filters remains useful for clarity and query design, but the isolation tests deliberately omit them to exercise the policy itself.

The tables also use relational constraints. For example, events and keys reference a child through the pair `(family_id, kid_id)`. A row that claims family A while pointing at family B's child fails the composite foreign key. The policy checks the row's family; the constraint checks that its related child belongs to that family too.

These checks serve different requirements. A family predicate does not validate every relationship in a record. The schema still needs keys, constraints, and appropriate application validation.

## The connection's role is part of the design

The repository separates the administrative connection from the application connection. The administrative handle is used for migrations, catalog loading, and test setup. Normal request code enters through `withFamily` and the application role.

The local role setup explicitly gives that role `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, and `NOCREATEROLE`. The migration grants the operations the application needs, while keeping administration separate.

PostgreSQL normally lets a table owner bypass RLS unless the table forces it. Superusers and roles with `BYPASSRLS` still bypass the policies. Consequently, testing a query through an administrative connection does not demonstrate isolation for the application. The role used in a test must match the role whose behavior is being asserted. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

The TypeScript layer adds another check. Store operations accept a branded `FamilyTx`, rather than any database handle. Only the scoped helper attaches that brand. Accidentally passing an owner connection to a function that expects scoped work becomes a type error.

That is useful development feedback, not a runtime security boundary. A cast or arbitrary SQL can bypass a TypeScript convention. The database role, policies, and trusted code that establishes context remain the controls that matter when a query executes.

## Family selection still needs authentication

The UUID check in `withFamily` verifies the shape of an identifier. It does not establish that the caller belongs to that family.

The request layer must resolve credentials, check the caller's membership, and choose the scope before entering the database callback. In the family-view flow, the selected family and user come from the authenticated actor. They are not accepted as an unrestricted scope from a request body.

This is a necessary trust boundary in a design that uses one shared application role. That role can set the custom family variable. If an attacker gains arbitrary SQL execution as that role, or if trusted server code deliberately selects the wrong tenant, the policy cannot tell that the context is dishonest.

The protection is valuable against queries that omit or misuse their tenant filter while running inside an established scope. It does not turn the database into an independent verifier of the web user's identity. Parameterized queries, authorization at the request boundary, and restricted access to database credentials remain necessary.

Some sign-in operations change scope inside a transaction after learning which family or user is involved. The repository exposes a `setScope` helper for those paths. That makes scope changes explicit, but it also makes those callers worth close review: changing context affects every subsequent query in that transaction.

## Keep shared data explicit

Not every row belongs to exactly one family. Lumischool's content table holds both family-authored material and shared catalog entries. A null family ID identifies catalog content.

Its read policy permits either a matching family ID or a null family ID. Its insert and delete policies permit only matching family-owned rows. The scoped application role cannot use the shared-read exception to create catalog entries; catalog loading uses the separate administrative path.

![Within family A's scope, private rows from A are available, private rows from B are hidden, and catalog rows are readable but not writable through the family path.](figure:tenant-row-policies)

User records need a different rule because a person can belong to multiple families. A user row is readable as oneself or through a membership in the current family. Ended memberships still permit a person's name to appear in historical records. Reading that name does not reactivate the membership.

There are also narrow exceptions for specific key records. They are named explicitly in the policy definitions and in the tests rather than hidden inside a broad rule that all unowned rows are public.

Each exception adds work to the review. The right question is which operation should be allowed on that row class. A shared SELECT policy should not silently become shared write access when another operation is added.

## Separate tenant isolation from permissions inside the tenant

A family is the database's main isolation unit. That does not mean every person in the family should receive every family row.

The family-view service loads data under the family scope, then handles parent and tutor access separately. A parent can receive the family view. A tutor's response is limited using the children and date range their membership permits. Children's sessions have their own request paths.

RLS provides the outer boundary between families. The application still implements the narrower permissions within a family. A query that is safe at the tenant level could still return too much information to a tutor if the service skips those checks.

This division keeps the common database predicate small, but it is a tradeoff. Moving more fine-grained permissions into policies could centralize them further, while increasing policy complexity and the number of inputs each transaction needs. The current code keeps family isolation in the database and the caller-specific response rules in the service layer.

## Check the migrated schema, not just the policy generator

The repository declares scoped tables in one `SCOPE` map. It names the family column and any shared-read condition. A generator produces the corresponding policy statements.

The integration test then reads `pg_class` and `pg_policies` from a database created using the real migration files. It compares the actual public tables with the declared list plus the separately handled users table. A new table cannot quietly remain outside that inventory without failing the comparison.

The test also checks policy expressions and shared-content rules. Another test reads the current policy definitions, recreates them from the generator inside a transaction, and compares PostgreSQL's resulting definitions with the migrated ones. This catches a generator that was updated without a matching migration, or a migration that drifted from the declaration.

A separate static guard checks table security declarations and database import boundaries. It restricts where connections can be opened and where driver-level queries can live. These checks make it harder for a new feature to introduce a second, less controlled route to the database.

They do not prove that every possible policy is correct. A matching declaration and migration can share the same mistake. Behavioral tests are still needed for the intended access rules.

## Exercise the failures the boundary is meant to prevent

The isolation suite creates two families and a person who belongs to both. It queries without tenant filters, attempts cross-family inserts, checks shared catalog reads, and verifies that one family's export excludes the other's records.

The connection-reuse test is particularly useful. It records PostgreSQL backend process IDs and performs repeated scoped and unscoped transactions. It requires at least one reused connection, then checks that the later unscoped transaction sees no family rows. Without the reuse assertion, a test could pass simply because it never exercised the pool behavior in question.

The current suite checks several important paths, but new tables need meaningful populated fixtures too. A table listed in the schema inventory is not the same as a cross-tenant behavior test with real rows in both families. Changes to privileged functions and within-family permissions also need their own cases.

There is a small set of privileged database functions for operations that begin before a family is known. Those functions deserve separate review of their inputs, result fields, execution grants, and search path. PostgreSQL's guidance explains why a security-definer function must not resolve objects through a schema writable by untrusted users. [Writing security-definer functions safely](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

The useful result is a database boundary that can be exercised independently of a particular endpoint. The application establishes an authenticated scope, the transaction limits its lifetime, and the database applies the row policies. Tests then check both the schema that was installed and the behavior of the role that serves requests.
