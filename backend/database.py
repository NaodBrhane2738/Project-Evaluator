import sqlite3
import json
import os
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "cyberarena.db")

class ResponseWrapper:
    def __init__(self, data):
        self.data = data
        self.count = len(data) if isinstance(data, list) else (1 if data else 0)
    
    def execute(self):
        return self

class TableQuery:
    def __init__(self, table_name, db_client):
        self.table_name = table_name
        self.db_client = db_client
        self._select_cols = "*"
        self._where_clauses = []
        self._where_params = []
        self._order_by = None
        self._limit = None
        self._update_data = None
        self._is_delete = False

    def select(self, cols="*", count=None):
        self._select_cols = cols
        return self

    def eq(self, column, value):
        self._where_clauses.append(f"{column} = ?")
        self._where_params.append(value)
        return self

    def order(self, column, desc=False):
        direction = "DESC" if desc else "ASC"
        self._order_by = f"{column} {direction}"
        return self

    def limit(self, count):
        self._limit = count
        return self

    def update(self, data):
        self._update_data = data
        return self

    def delete(self):
        self._is_delete = True
        return self

    def execute(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Handle delete flow: table('x').delete().eq('id', val).execute()
        if self._is_delete:
            sql = f"DELETE FROM {self.table_name}"
            if self._where_clauses:
                sql += " WHERE " + " AND ".join(self._where_clauses)
            cursor.execute(sql, self._where_params)
            conn.commit()
            conn.close()
            return ResponseWrapper([])

        # Handle update flow: table('x').update({...}).eq('id', val).execute()
        if self._update_data is not None:
            row = dict(self._update_data)
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
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return ResponseWrapper(rows)

        # Standard SELECT flow
        sql = f"SELECT {self._select_cols} FROM {self.table_name}"
        if self._where_clauses:
            sql += " WHERE " + " AND ".join(self._where_clauses)
        if self._order_by:
            sql += f" ORDER BY {self._order_by}"
        if self._limit:
            sql += f" LIMIT {self._limit}"

        cursor.execute(sql, self._where_params)
        rows = cursor.fetchall()

        data = []
        for r in rows:
            d = dict(r)
            if 'metadata' in d and isinstance(d['metadata'], str):
                try:
                    d['metadata'] = json.loads(d['metadata'])
                except Exception:
                    pass
            if 'hidden' in d:
                d['hidden'] = bool(d['hidden'])
            data.append(d)

        conn.close()
        return ResponseWrapper(data)

    def maybe_single(self):
        res = self.execute()
        data = res.data[0] if res.data else None
        return ResponseWrapper(data)

    def single(self):
        return self.maybe_single()

    def insert(self, data):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if isinstance(data, dict):
            items = [data]
        else:
            items = data

        inserted = []
        for item in items:
            row = dict(item)
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
            
            inserted_row = dict(cursor.fetchone())
            if 'metadata' in inserted_row and isinstance(inserted_row['metadata'], str):
                try:
                    inserted_row['metadata'] = json.loads(inserted_row['metadata'])
                except Exception:
                    pass
            if 'hidden' in inserted_row:
                inserted_row['hidden'] = bool(inserted_row['hidden'])
            inserted.append(inserted_row)

        conn.commit()
        conn.close()
        return ResponseWrapper(inserted)

class SQLiteClient:
    def table(self, table_name):
        return TableQuery(table_name, self)

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
            _supabase_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        return _supabase_client
    return SQLiteClient()
