import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const client = neon(process.env.DATABASE_URL!);

type SqlFunction = {
  (strings: TemplateStringsArray, ...params: any[]): Promise<any>;
  (queryString: string, params?: any[]): Promise<any>;
  query: typeof client.query;
  unsafe: typeof client.unsafe;
  transaction: typeof client.transaction;
};

const sqlHandler = function (
  stringsOrQuery: TemplateStringsArray | string,
  ...params: any[]
): Promise<any> {
  if (typeof stringsOrQuery === 'string') {
    const values = params[0] && Array.isArray(params[0]) ? params[0] : params;
    return client.query(stringsOrQuery, values);
  }
  return (client as any)(stringsOrQuery, ...params);
};

export const sql = Object.assign(sqlHandler, client) as unknown as SqlFunction;
