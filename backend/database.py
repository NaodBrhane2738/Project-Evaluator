import sqlite3
import json
import os
import uuid
DB_PATH = os.path.join(os.path.dirname(__file__), "project_evaluator.db")
_old_db = os.path.join(os.path.dirname(__file__), "cyberarena.db")
if not os.path.exists(DB_PATH) and os.path.exists(_old_db):
    try:
        import shutil
        shutil.copyfile(_old_db, DB_PATH)
    except Exception:
        pass

import re

SAFE_IDENT_RE = re.compile(r'^[A-Za-z0-9_]+$')

def validate_ident(name: str) -> str:
    if not name or not SAFE_IDENT_RE.match(name):
        raise ValueError(f"Invalid SQL identifier: {name}")
    return name

def get_sqlite_conn():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA busy_timeout = 5000;")
    return conn

def format_row(r) -> dict:
    d = dict(r)
    if 'metadata' in d and isinstance(d['metadata'], str):
        try:
            d['metadata'] = json.loads(d['metadata'])
        except Exception:
            pass
    if 'hidden' in d:
        d['hidden'] = bool(d['hidden'])
    return d

class ResponseWrapper:
    def __init__(self, data):
        self.data = data
        self.count = len(data) if isinstance(data, list) else (1 if data is not None else 0)
    
    def execute(self):
        return self

class TableQuery:
    def __init__(self, table_name, db_client):
        self.table_name = validate_ident(table_name)
        self.db_client = db_client
        self._select_cols = "*"
        self._where_clauses = []
        self._where_params = []
        self._order_by = None
        self._limit = None
        self._update_data = None
        self._is_delete = False

    def select(self, cols="*", count=None):
        if cols != "*":
            # Validate comma-separated column names
            for col in cols.split(','):
                c = col.strip()
                if c and not SAFE_IDENT_RE.match(c):
                    raise ValueError(f"Invalid column name: {c}")
        self._select_cols = cols
        return self

    def eq(self, column, value):
        valid_col = validate_ident(column)
        self._where_clauses.append(f"{valid_col} = ?")
        self._where_params.append(value)
        return self

    def order(self, column, desc=False):
        valid_col = validate_ident(column)
        direction = "DESC" if desc else "ASC"
        self._order_by = f"{valid_col} {direction}"
        return self

    def limit(self, count):
        if count is not None:
            self._limit = int(count)
        return self

    def update(self, data):
        self._update_data = data
        return self

    def delete(self):
        self._is_delete = True
        return self

    def execute(self):
        conn = get_sqlite_conn()
        try:
            cursor = conn.cursor()

            # Handle delete flow: table('x').delete().eq('id', val).execute()
            if self._is_delete:
                sql = f"DELETE FROM {self.table_name}"
                if self._where_clauses:
                    sql += " WHERE " + " AND ".join(self._where_clauses)
                cursor.execute(sql, self._where_params)
                conn.commit()
                return ResponseWrapper([])

            # Handle update flow: table('x').update({...}).eq('id', val).execute()
            if self._update_data is not None:
                row = dict(self._update_data)
                for k in row.keys():
                    validate_ident(k)

                if 'metadata' in row and isinstance(row['metadata'], (dict, list)):
                    row['metadata'] = json.dumps(row['metadata'])
                if 'hidden' in row:
                    row['hidden'] = 1 if row['hidden'] else 0

                set_clauses = [f"{k} = ?" for k in row.keys()]
                params = list(row.values()) + self._where_params

                sql = f"UPDATE {self.table_name} SET {', '.join(set_clauses)}"
                if self._where_clauses:
                    sql += " WHERE " + " AND ".join(self._where_clauses)

                cursor.execute(sql, params)
                conn.commit()

                sql_fetch = f"SELECT * FROM {self.table_name}"
                if self._where_clauses:
                    sql_fetch += " WHERE " + " AND ".join(self._where_clauses)
                cursor.execute(sql_fetch, self._where_params)
                rows = [format_row(r) for r in cursor.fetchall()]
                return ResponseWrapper(rows)

            # Standard SELECT flow
            sql = f"SELECT {self._select_cols} FROM {self.table_name}"
            if self._where_clauses:
                sql += " WHERE " + " AND ".join(self._where_clauses)
            if self._order_by:
                sql += f" ORDER BY {self._order_by}"
            if self._limit is not None:
                sql += f" LIMIT {self._limit}"

            cursor.execute(sql, self._where_params)
            rows = cursor.fetchall()
            data = [format_row(r) for r in rows]
            return ResponseWrapper(data)
        finally:
            conn.close()

    def maybe_single(self):
        res = self.execute()
        data = res.data[0] if res.data else None
        return ResponseWrapper(data)

    def single(self):
        return self.maybe_single()

    def insert(self, data):
        conn = get_sqlite_conn()
        try:
            cursor = conn.cursor()

            if isinstance(data, dict):
                items = [data]
            else:
                items = list(data)

            inserted = []
            for item in items:
                row = dict(item)
                for k in row.keys():
                    validate_ident(k)

                if 'id' not in row and self.table_name != 'competition_state':
                    row['id'] = str(uuid.uuid4())

                if 'metadata' in row and isinstance(row['metadata'], (dict, list)):
                    row['metadata'] = json.dumps(row['metadata'])
                if 'hidden' in row:
                    row['hidden'] = 1 if row['hidden'] else 0

                cols = list(row.keys())
                vals = list(row.values())
                placeholders = ", ".join(["?"] * len(cols))
                col_names = ", ".join(cols)

                sql = f"INSERT INTO {self.table_name} ({col_names}) VALUES ({placeholders})"
                cursor.execute(sql, vals)
                
                fetch_id = row.get('id')
                if fetch_id:
                    cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = ?", (fetch_id,))
                else:
                    cursor.execute(f"SELECT * FROM {self.table_name} WHERE rowid = last_insert_rowid()")
                
                fetched = cursor.fetchone()
                if fetched:
                    inserted.append(format_row(fetched))

            conn.commit()
            return ResponseWrapper(inserted)
        finally:
            conn.close()

class SQLiteClient:
    def table(self, table_name):
        return TableQuery(table_name, self)

class QueryProxy:
    def __init__(self, query):
        self._query = query

    def __getattr__(self, name):
        attr = getattr(self._query, name)
        if callable(attr):
            def wrapper(*args, **kwargs):
                res = attr(*args, **kwargs)
                if hasattr(res, 'execute'):
                    return QueryProxy(res)
                return res
            return wrapper
        return attr

    def execute(self):
        res = self._query.execute()
        if res is None:
            return ResponseWrapper(None)
        return res

class TableProxy:
    def __init__(self, table):
        self._table = table

    def __getattr__(self, name):
        attr = getattr(self._table, name)
        if callable(attr):
            def wrapper(*args, **kwargs):
                res = attr(*args, **kwargs)
                if hasattr(res, 'execute'):
                    return QueryProxy(res)
                return res
            return wrapper
        return attr

class SupabaseWrapper:
    def __init__(self, client):
        self._client = client

    def table(self, table_name):
        return TableProxy(self._client.table(table_name))

_supabase_client = None

def get_supabase():
    global _supabase_client
    from config import settings
    if (
        settings.supabase_url
        and settings.supabase_url.startswith("https://")
        and settings.supabase_service_role_key
        and settings.supabase_service_role_key != "placeholder"
    ):
        if _supabase_client is None:
            from supabase import create_client
            raw_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
            _supabase_client = SupabaseWrapper(raw_client)
        return _supabase_client
    return SQLiteClient()
