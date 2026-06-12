import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  handleAddWorkspaceMember,
  type AddWorkspaceMemberErrorResponse,
} from './handler.ts';
import { readAddWorkspaceMemberEnv } from './env.ts';

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
      const { supabaseUrl, publishableKey, secretKey } = readAddWorkspaceMemberEnv();
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
        visibleClient: userClient,
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
