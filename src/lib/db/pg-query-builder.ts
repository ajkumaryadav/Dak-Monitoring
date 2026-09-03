import type postgres from "postgres";
import { getPgClient } from "@/lib/db/pg-client";

type FilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "or"
  | "not_null"
  | "not_in";

interface FilterCondition {
  column: string;
  op: FilterOp;
  value: unknown;
}

interface OrderCondition {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

interface ParsedRelation {
  table: string;
  alias: string;
  foreignKey: string;
  columns: string[];
  nestedRelations: ParsedRelation[];
}

export interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
  count?: number | null;
}

const KNOWN_RELATIONS: Record<string, { table: string; foreignKey: string; parentKey: string }> = {
  departments: { table: "departments", foreignKey: "department_id", parentKey: "id" },
  department: { table: "departments", foreignKey: "department_id", parentKey: "id" },
  from_department: { table: "departments", foreignKey: "from_department_id", parentKey: "id" },
  to_department: { table: "departments", foreignKey: "to_department_id", parentKey: "id" },
  sections: { table: "sections", foreignKey: "section_id", parentKey: "id" },
  section: { table: "sections", foreignKey: "section_id", parentKey: "id" },
  roles: { table: "roles", foreignKey: "role_id", parentKey: "id" },
  role: { table: "roles", foreignKey: "role_id", parentKey: "id" },
  assignment_units: { table: "assignment_units", foreignKey: "assignment_unit_id", parentKey: "id" },
  assignment_unit: { table: "assignment_units", foreignKey: "assignment_unit_id", parentKey: "id" },
  dak_sources: { table: "dak_sources", foreignKey: "source_id", parentKey: "id" },
  source: { table: "dak_sources", foreignKey: "source_id", parentKey: "id" },
  users: { table: "users", foreignKey: "assigned_to", parentKey: "id" },
  assigned_officer: { table: "users", foreignKey: "assigned_to", parentKey: "id" },
  created_user: { table: "users", foreignKey: "created_by", parentKey: "id" },
  performer: { table: "users", foreignKey: "performed_by", parentKey: "id" },
  submitter: { table: "users", foreignKey: "submitted_by", parentKey: "id" },
  dak_entries: { table: "dak_entries", foreignKey: "dak_id", parentKey: "id" },
  dak: { table: "dak_entries", foreignKey: "dak_id", parentKey: "id" },
};

const KNOWN_TABLES = new Set([
  "users",
  "roles",
  "departments",
  "assignment_units",
  "sections",
  "dak_entries",
  "dak_sources",
  "dak_history",
  "dak_timeline",
  "dak_atr",
  "dak_remarks",
  "notifications",
  "tasks",
  "task_assignees",
  "attachments",
  "system_backups",
  "system_admin_logs",
]);

const COLUMN_TO_TABLE: Record<string, string> = {
  created_by: "users",
  deleted_by: "users",
  performed_by: "users",
  assigned_to: "users",
  submitted_by: "users",
  user_id: "users",
  transferred_by: "users",
  department_id: "departments",
  from_department_id: "departments",
  to_department_id: "departments",
  section_id: "assignment_units",
  assignment_unit_id: "assignment_units",
  source_id: "dak_sources",
  role_id: "roles",
  dak_id: "dak_entries",
};

function resolveForeignKey(parentTable: string, targetTable: string, alias: string, fkHint: string): string {
  if (fkHint) {
    const hint = fkHint.toLowerCase();
    if (hint.includes("performed_by")) return "performed_by";
    if (hint.includes("deleted_by")) return "deleted_by";
    if (hint.includes("created_by")) return "created_by";
    if (hint.includes("assigned_to")) return "assigned_to";
    if (hint.includes("submitted_by")) return "submitted_by";
    if (hint.includes("transferred_by")) return "transferred_by";
    if (hint.includes("from_department")) return "from_department_id";
    if (hint.includes("to_department")) return "to_department_id";
    if (hint.includes("department_id") || hint.includes("department")) return "department_id";
    if (hint.includes("section_id") || hint.includes("section")) return "section_id";
    if (hint.includes("assignment_unit_id") || hint.includes("assignment_unit")) return "assignment_unit_id";
    if (hint.includes("source_id") || hint.includes("source")) return "source_id";
    if (hint.includes("role_id") || hint.includes("role")) return "role_id";
    if (hint.includes("dak_id") || hint.includes("dak")) return "dak_id";
  }

  if (parentTable === "dak_history") {
    if (targetTable === "users" || alias === "performer") return "performed_by";
    if (targetTable === "dak_entries" || alias === "dak") return "dak_id";
  }
  if (parentTable === "dak_atr") {
    if (targetTable === "users" || alias === "submitter") return "submitted_by";
    if (targetTable === "dak_entries" || alias === "dak") return "dak_id";
  }
  if (parentTable === "dak_transfers") {
    if (targetTable === "users") return "transferred_by";
    if (targetTable === "dak_entries" || alias === "dak") return "dak_id";
    if (alias === "from_department") return "from_department_id";
    if (alias === "to_department") return "to_department_id";
  }
  if (parentTable === "dak_entries") {
    if (alias === "assigned_officer" || alias === "assigned_to") return "assigned_to";
    if (alias === "created_user" || alias === "created_by") return "created_by";
    if (targetTable === "departments" || alias === "departments") return "department_id";
    if (targetTable === "sections" || alias === "sections") return "section_id";
    if (targetTable === "assignment_units" || alias === "assignment_units") return "assignment_unit_id";
    if (targetTable === "dak_sources" || alias === "dak_sources") return "source_id";
  }
  if (parentTable === "tasks") {
    if (targetTable === "users" || alias === "assigned_to") return "assigned_to";
    if (alias === "created_by") return "created_by";
    if (targetTable === "dak_entries" || alias === "dak") return "dak_id";
    if (targetTable === "departments") return "department_id";
  }
  if (parentTable === "users") {
    if (targetTable === "roles" || alias === "roles") return "role_id";
    if (targetTable === "departments" || alias === "departments") return "department_id";
    if (targetTable === "sections" || alias === "sections" || targetTable === "assignment_units" || alias === "assignment_units") return "section_id";
  }
  if (parentTable === "assignment_units" || parentTable === "sections") {
    if (targetTable === "departments" || alias === "departments") return "department_id";
  }
  if (parentTable === "system_backups") {
    if (targetTable === "users" || alias === "users") return "created_by";
  }

  if (KNOWN_RELATIONS[alias]) return KNOWN_RELATIONS[alias].foreignKey;
  if (KNOWN_RELATIONS[targetTable]) return KNOWN_RELATIONS[targetTable].foreignKey;

  const singular = targetTable.replace(/_entries$/, "").replace(/s$/, "");
  return `${singular}_id`;
}

function tokenizeSelectString(str: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) tokens.push(trimmed);
      current = "";
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed) tokens.push(trimmed);

  return tokens;
}

function parseSelectTokens(tokens: string[], parentTable: string): {
  directColumns: string[];
  relations: ParsedRelation[];
} {
  const directColumns: string[] = [];
  const relations: ParsedRelation[] = [];

  for (const token of tokens) {
    const openParen = token.indexOf("(");
    if (openParen === -1) {
      // Direct column
      const col = token.trim();
      if (col) directColumns.push(col);
      continue;
    }

    // Relation: e.g. performer:users!dak_history_performed_by_fkey(name, roles(slug, name))
    const header = token.slice(0, openParen).trim();
    const lastCloseParen = token.lastIndexOf(")");
    const innerStr = token.slice(openParen + 1, lastCloseParen === -1 ? undefined : lastCloseParen).trim();

    let alias = "";
    let target = "";
    if (header.includes(":")) {
      const colonIdx = header.indexOf(":");
      alias = header.slice(0, colonIdx).trim();
      target = header.slice(colonIdx + 1).trim();
    } else {
      alias = header;
      target = header;
    }

    let table = "";
    let fkHint = "";
    if (target.includes("!")) {
      const bangIdx = target.indexOf("!");
      table = target.slice(0, bangIdx).trim();
      fkHint = target.slice(bangIdx + 1).trim();
    } else {
      fkHint = "";
      if (COLUMN_TO_TABLE[target]) {
        fkHint = target;
        if (KNOWN_TABLES.has(alias)) {
          table = alias;
        } else {
          table = COLUMN_TO_TABLE[target];
        }
      } else if (KNOWN_TABLES.has(target)) {
        table = target;
      } else if (KNOWN_TABLES.has(alias)) {
        table = alias;
      } else {
        table = target;
      }
    }

    const foreignKey = resolveForeignKey(parentTable, table, alias, fkHint);
    const innerTokens = tokenizeSelectString(innerStr);
    const parsedInner = parseSelectTokens(innerTokens, table);

    relations.push({
      table,
      alias,
      foreignKey,
      columns: parsedInner.directColumns,
      nestedRelations: parsedInner.relations,
    });
  }

  return { directColumns, relations };
}

let relationCounter = 0;

function buildRelationJsonSubquery(rel: ParsedRelation, parentAlias: string): string {
  relationCounter++;
  const relAlias = `r_${rel.alias}_${relationCounter}`;
  const jsonFields: string[] = [];

  for (const col of rel.columns) {
    if (col === "*") {
      jsonFields.push(`'id', ${relAlias}."id"`);
    } else {
      jsonFields.push(`'${col}', ${relAlias}."${col}"`);
    }
  }

  for (const nested of rel.nestedRelations) {
    const nestedSubquery = buildRelationJsonSubquery(nested, relAlias);
    jsonFields.push(`'${nested.alias}', (${nestedSubquery})`);
  }

  const jsonObject = jsonFields.length > 0 ? `jsonb_build_object(${jsonFields.join(", ")})` : `'{}'::jsonb`;

  return `SELECT ${jsonObject} FROM public."${rel.table}" ${relAlias} WHERE ${relAlias}."id" = ${parentAlias}."${rel.foreignKey}"`;
}

export class PgQueryBuilder<T = any> {
  private tableName: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private selectColumns = "*";
  private isCountOnly = false;
  private isHeadOnly = false;
  private insertData: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateData: Record<string, unknown> | null = null;
  private filters: FilterCondition[] = [];
  private rawOrFilters: string[] = [];
  private orderings: OrderCondition[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private isUpsert = false;
  private upsertConflictCol = "id";

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(
    columns = "*",
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }
  ): this {
    this.action = "select";
    this.selectColumns = columns;
    if (options?.count) {
      this.isCountOnly = true;
    }
    if (options?.head) {
      this.isHeadOnly = true;
    }
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.action = "insert";
    this.insertData = data;
    return this;
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): this {
    this.action = "insert";
    this.isUpsert = true;
    this.insertData = data;
    this.upsertConflictCol = options?.onConflict || "id";
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.action = "update";
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "eq", value });
    }
    return this;
  }

  neq(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "neq", value });
    }
    return this;
  }

  gt(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "gt", value });
    }
    return this;
  }

  gte(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "gte", value });
    }
    return this;
  }

  lt(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "lt", value });
    }
    return this;
  }

  lte(column: string, value: unknown): this {
    if (value !== undefined) {
      this.filters.push({ column, op: "lte", value });
    }
    return this;
  }

  like(column: string, pattern: string): this {
    if (pattern !== undefined) {
      this.filters.push({ column, op: "like", value: pattern });
    }
    return this;
  }

  ilike(column: string, pattern: string): this {
    if (pattern !== undefined) {
      this.filters.push({ column, op: "ilike", value: pattern });
    }
    return this;
  }

  is(column: string, value: null | boolean): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    if (Array.isArray(values)) {
      this.filters.push({ column, op: "in", value: values });
    }
    return this;
  }

  not(column: string, op: string, value: unknown): this {
    if (op === "is" && value === null) {
      this.filters.push({ column, op: "not_null", value: null });
    } else if (op === "eq" || op === "is") {
      this.filters.push({ column, op: "neq", value });
    } else if (op === "in") {
      this.filters.push({ column, op: "not_in", value });
    } else {
      this.filters.push({ column, op: "neq", value });
    }
    return this;
  }

  or(filterString: string): this {
    if (filterString && filterString.trim().length > 0) {
      this.rawOrFilters.push(filterString.trim());
    }
    return this;
  }

  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ): this {
    this.orderings.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single(): Promise<QueryResult<T>> {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle(): Promise<QueryResult<T>> {
    this.isMaybeSingle = true;
    return this.execute();
  }

  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected);
  }

  async execute(): Promise<QueryResult<any>> {
    const sql = getPgClient();

    try {
      if (this.action === "select") {
        return await this.executeSelect(sql);
      } else if (this.action === "insert") {
        return await this.executeInsert(sql);
      } else if (this.action === "update") {
        return await this.executeUpdate(sql);
      } else if (this.action === "delete") {
        return await this.executeDelete(sql);
      }
      return { data: null, error: null };
    } catch (err: any) {
      console.error(`[PgQueryBuilder ${this.tableName}]`, err);
      return {
        data: null,
        error: {
          message: err.message || "Database query failed",
          code: err.code,
          details: err.detail,
        },
      };
    }
  }

  private async executeSelect(sql: postgres.Sql): Promise<QueryResult<any>> {
    const tokens = tokenizeSelectString(this.selectColumns);
    const { directColumns, relations } = parseSelectTokens(tokens, this.tableName);

    // If count query requested
    let totalCount: number | null = null;
    if (this.isCountOnly) {
      const countSql = this.buildCountQuery();
      const countRes = await sql.unsafe(countSql.query, countSql.params);
      totalCount = parseInt(countRes[0]?.count || "0", 10);

      if (this.isHeadOnly) {
        return { data: [], error: null, count: totalCount };
      }
    }

    // Build SELECT fields
    const selectFields: string[] = [];
    if (directColumns.length === 0 && relations.length === 0) {
      selectFields.push("m.*");
    } else {
      for (const col of directColumns) {
        if (col === "*") {
          selectFields.push("m.*");
        } else {
          selectFields.push(`m."${col}"`);
        }
      }
    }

    // Add JSON subqueries for relations
    for (const rel of relations) {
      const subquery = buildRelationJsonSubquery(rel, "m");
      selectFields.push(`(${subquery}) AS "${rel.alias}"`);
    }

    const { whereClause, params } = this.buildWhereClause();
    let query = `SELECT ${selectFields.join(", ")} FROM public."${this.tableName}" m`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    if (this.orderings.length > 0) {
      const orderClauses = this.orderings.map(
        (o) => `m."${o.column}" ${o.ascending ? "ASC" : "DESC"}${o.nullsFirst ? " NULLS FIRST" : " NULLS LAST"}`
      );
      query += ` ORDER BY ${orderClauses.join(", ")}`;
    }

    if (this.limitCount !== null) {
      query += ` LIMIT ${this.limitCount}`;
    }
    if (this.offsetCount !== null) {
      query += ` OFFSET ${this.offsetCount}`;
    }

    const rows = await sql.unsafe(query, params);

    if (this.isSingle) {
      if (rows.length === 0) {
        return {
          data: null,
          error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
          count: totalCount,
        };
      }
      return { data: rows[0], error: null, count: totalCount };
    }

    if (this.isMaybeSingle) {
      return { data: rows[0] ?? null, error: null, count: totalCount };
    }

    return { data: rows, error: null, count: totalCount };
  }

  private buildCountQuery(): { query: string; params: any[] } {
    const { whereClause, params } = this.buildWhereClause();
    let query = `SELECT count(*)::int AS count FROM public."${this.tableName}" m`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    return { query, params };
  }

  private async executeInsert(sql: postgres.Sql): Promise<QueryResult<any>> {
    if (!this.insertData) {
      return { data: null, error: null };
    }

    const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
    if (records.length === 0) {
      return { data: [], error: null };
    }

    const allKeys = Array.from(
      new Set(records.flatMap((r) => Object.keys(r)))
    );

    let rows: any[] = [];

    if (this.isUpsert) {
      const conflictCol = this.upsertConflictCol || "id";
      const updateKeys = allKeys.filter((k) => k !== conflictCol);

      if (updateKeys.length === 0) {
        rows = await sql`
          INSERT INTO public.${sql(this.tableName)} ${sql(records as any, allKeys)}
          ON CONFLICT (${sql(conflictCol)}) DO NOTHING
          RETURNING *
        `;
      } else {
        const updateSets = updateKeys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ");
        const insertColumns = allKeys.map((k) => `"${k}"`).join(", ");

        for (const record of records) {
          const values = allKeys.map((k) => (record as any)[k]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          const query = `
            INSERT INTO public."${this.tableName}" (${insertColumns})
            VALUES (${placeholders})
            ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateSets}
            RETURNING *
          `;
          const res = await sql.unsafe(query, values);
          if (res.length > 0) rows.push(res[0]);
        }
      }
    } else {
      rows = await sql`
        INSERT INTO public.${sql(this.tableName)} ${sql(records as any, allKeys)}
        RETURNING *
      `;
    }

    if (this.isSingle) {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  private async executeUpdate(sql: postgres.Sql): Promise<QueryResult<any>> {
    if (!this.updateData) {
      return { data: null, error: null };
    }

    const { whereClause, params } = this.buildWhereClause();
    const updateKeys = Object.keys(this.updateData);
    if (updateKeys.length === 0) {
      return { data: [], error: null };
    }

    const setFragments = updateKeys.map((k) => `"${k}" = $${params.length + updateKeys.indexOf(k) + 1}`);
    const updateValues = updateKeys.map((k) => (this.updateData as any)[k]);
    const allParams = [...params, ...updateValues];

    let query = `UPDATE public."${this.tableName}" SET ${setFragments.join(", ")}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    query += " RETURNING *";

    const rows = await sql.unsafe(query, allParams);

    if (this.isSingle) {
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  private async executeDelete(sql: postgres.Sql): Promise<QueryResult<any>> {
    const { whereClause, params } = this.buildWhereClause();
    let query = `DELETE FROM public."${this.tableName}"`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    query += " RETURNING *";

    const rows = await sql.unsafe(query, params);
    return { data: rows, error: null };
  }

  private buildWhereClause(): { whereClause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const f of this.filters) {
      if (f.op === "eq") {
        clauses.push(`m."${f.column}" = $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "neq") {
        clauses.push(`m."${f.column}" != $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "gt") {
        clauses.push(`m."${f.column}" > $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "gte") {
        clauses.push(`m."${f.column}" >= $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "lt") {
        clauses.push(`m."${f.column}" < $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "lte") {
        clauses.push(`m."${f.column}" <= $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "like") {
        clauses.push(`m."${f.column}" LIKE $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "ilike") {
        clauses.push(`m."${f.column}" ILIKE $${pIdx++}`);
        params.push(f.value);
      } else if (f.op === "is") {
        if (f.value === null) {
          clauses.push(`m."${f.column}" IS NULL`);
        } else {
          clauses.push(`m."${f.column}" IS ${f.value ? "TRUE" : "FALSE"}`);
        }
      } else if (f.op === "in") {
        const arr = Array.isArray(f.value) ? f.value : [f.value];
        if (arr.length === 0) {
          clauses.push("1=0");
        } else {
          const inPlaceholders = arr.map(() => `$${pIdx++}`).join(", ");
          clauses.push(`m."${f.column}" IN (${inPlaceholders})`);
          params.push(...arr);
        }
      } else if (f.op === "not_null") {
        clauses.push(`m."${f.column}" IS NOT NULL`);
      } else if (f.op === "not_in") {
        const arr = Array.isArray(f.value) ? f.value : [f.value];
        if (arr.length > 0) {
          const inPlaceholders = arr.map(() => `$${pIdx++}`).join(", ");
          clauses.push(`m."${f.column}" NOT IN (${inPlaceholders})`);
          params.push(...arr);
        }
      }
    }

    for (const rawOr of this.rawOrFilters) {
      // Parse or conditions like "status.eq.assigned,status.eq.pending" or "name.ilike.%foo%"
      const orParts = rawOr.split(",").map((p) => p.trim());
      const orClauses: string[] = [];

      for (const part of orParts) {
        const dotIdx1 = part.indexOf(".");
        if (dotIdx1 === -1) continue;
        const col = part.slice(0, dotIdx1);
        const rest = part.slice(dotIdx1 + 1);
        const dotIdx2 = rest.indexOf(".");
        const op = dotIdx2 === -1 ? rest : rest.slice(0, dotIdx2);
        const val = dotIdx2 === -1 ? "" : rest.slice(dotIdx2 + 1);

        if (op === "eq") {
          orClauses.push(`m."${col}" = $${pIdx++}`);
          params.push(val);
        } else if (op === "ilike") {
          orClauses.push(`m."${col}" ILIKE $${pIdx++}`);
          params.push(val);
        } else if (op === "is") {
          if (val === "null") {
            orClauses.push(`m."${col}" IS NULL`);
          } else {
            orClauses.push(`m."${col}" IS ${val}`);
          }
        }
      }

      if (orClauses.length > 0) {
        clauses.push(`(${orClauses.join(" OR ")})`);
      }
    }

    return {
      whereClause: clauses.join(" AND "),
      params,
    };
  }
}
