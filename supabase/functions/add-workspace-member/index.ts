import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  handleAddWorkspaceMember,
  type AddWorkspaceMemberErrorResponse,
} from './handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const supabaseUrl = readRequiredEnv('SUPABASE_URL');
      const publishableKey = readKey('SUPABASE_PUBLISHABLE_KEYS') ?? readRequiredEnv('SUPABASE_ANON_KEY');
      const secretKey =
        readKey('SUPABASE_SECRET_KEYS') ??
        readRequiredEnv(['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_'));
      const authHeader = req.headers.get('Authorization') ?? '';

      const userClient = createClient(supabaseUrl, publishableKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });
      const {
        data: { user },
        error: authError,
      } = await userClient.auth.getUser();

      if (authError || !user) {
        return json(
          {
            code: 'unauthenticated',
            message: 'Войдите, чтобы добавить участника.',
          },
          401,
        );
      }

      const adminClient = createClient(supabaseUrl, secretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      const result = await handleAddWorkspaceMember({
        callerUserId: user.id,
        client: adminClient,
        body: await readJson(req),
      });

      return json(result.body, result.status);
    } catch {
      return json(
        {
          code: 'internal_error',
          message: 'Не удалось добавить участника.',
        },
        500,
      );
    }
  },
};

function readJson(req: Request) {
  return req.json().catch(() => null);
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function readKey(envName: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS') {
  const raw = Deno.env.get(envName);

  if (!raw) {
    return null;
  }

  try {
    const keys = JSON.parse(raw) as Record<string, string | undefined>;
    return keys.default ?? Object.values(keys).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

function readRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}
