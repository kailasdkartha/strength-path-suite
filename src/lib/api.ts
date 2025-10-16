import { supabase } from "@/integrations/supabase/client";

type PublicSchema = import("@/integrations/supabase/types").Database["public"];
type PublicTables = PublicSchema["Tables"];
export type TableName = keyof PublicTables;
type Row<T extends TableName> = PublicTables[T]["Row"];
type Insert<T extends TableName> = PublicTables[T]["Insert"];
type Update<T extends TableName> = PublicTables[T]["Update"];

function applyMatch<T extends TableName>(
	query: any,
	match?: Partial<Row<T>>
) {
	if (!match) return query;
	Object.entries(match).forEach(([key, value]) => {
		query = query.eq(key, value as any);
	});
	return query;
}

export async function apiList<T extends TableName>(
	table: T,
	options?: {
		select?: string;
		match?: Partial<Row<T>>;
		order?: { column: keyof Row<T>; ascending?: boolean | null };
		limit?: number;
		offset?: number;
	}
): Promise<{ data: Row<T>[] | null; error: Error | null }> {
	try {
		let query = supabase.from(table).select(options?.select ?? "*");
		query = applyMatch<T>(query, options?.match);
		if (options?.order) {
			query = query.order(String(options.order.column), {
				ascending: options.order.ascending ?? true,
			});
		}
		if (typeof options?.limit === "number") {
			query = query.limit(options.limit);
		}
		if (typeof options?.offset === "number") {
			query = query.range(options.offset, (options.offset + (options.limit ?? 0)) - 1);
		}
		const { data, error } = await query;
		return { data: (data as unknown as Row<T>[] | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

export async function apiGet<T extends TableName>(
	table: T,
	match: Partial<Row<T>>,
	select: string = "*"
): Promise<{ data: Row<T> | null; error: Error | null }> {
	try {
		let query = supabase.from(table).select(select).match(match).maybeSingle();
		const { data, error } = await query;
		return { data: (data as unknown as Row<T> | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

export async function apiInsert<T extends TableName>(
	table: T,
	values: Insert<T> | Insert<T>[]
): Promise<{ data: Row<T>[] | null; error: Error | null }> {
	try {
		const payload = (Array.isArray(values) ? values : [values]) as any[];
		const { data, error } = await supabase.from(table as any).insert(payload as any).select();
		return { data: (data as unknown as Row<T>[] | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

export async function apiUpsert<T extends TableName>(
	table: T,
	values: Insert<T> | Insert<T>[]
): Promise<{ data: Row<T>[] | null; error: Error | null }> {
	try {
		const payload = (Array.isArray(values) ? values : [values]) as any[];
		const { data, error } = await supabase.from(table as any).upsert(payload as any).select();
		return { data: (data as unknown as Row<T>[] | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

export async function apiUpdate<T extends TableName>(
	table: T,
	values: Update<T>,
	match: Partial<Row<T>>
): Promise<{ data: Row<T>[] | null; error: Error | null }> {
	try {
		let query = supabase.from(table as any).update(values as any).select();
		query = applyMatch<T>(query, match);
		const { data, error } = await query;
		return { data: (data as unknown as Row<T>[] | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

export async function apiDelete<T extends TableName>(
	table: T,
	match: Partial<Row<T>>
): Promise<{ data: Row<T>[] | null; error: Error | null }> {
	try {
		let query = supabase.from(table).delete().select();
		query = applyMatch<T>(query, match);
		const { data, error } = await query;
		return { data: (data as unknown as Row<T>[] | null) ?? null, error: error as any };
	} catch (e) {
		return { data: null, error: e as Error };
	}
}

