export type AddWorkspaceMemberEnv = {
  supabaseUrl: string;
  publishableKey: string;
  secretKey: string;
};

type EnvReader = (name: string) => string | null | undefined;

const supabaseServiceRoleKeyName = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');
const localServiceRoleKeyName = [
  'TASK_MANAGER',
  'SUPABASE',
  'SERVICE',
  'ROLE',
  'KEY',
].join('_');

export function readAddWorkspaceMemberEnv(
  readEnv: EnvReader = readDenoEnv,
): AddWorkspaceMemberEnv {
  const supabaseUrl = readFirst(readEnv, [
    'SUPABASE_URL',
    'TASK_MANAGER_SUPABASE_URL',
  ]);
  const publishableKey =
    readKeyDictionary(readEnv('SUPABASE_PUBLISHABLE_KEYS')) ??
    readFirst(readEnv, ['SUPABASE_ANON_KEY', 'TASK_MANAGER_SUPABASE_ANON_KEY']);
  const secretKey =
    readKeyDictionary(readEnv('SUPABASE_SECRET_KEYS')) ??
    readFirst(readEnv, [supabaseServiceRoleKeyName, localServiceRoleKeyName]);
  const missing = [
    ['supabaseUrl', supabaseUrl],
    ['publishableKey', publishableKey],
    ['secretKey', secretKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `Missing add-workspace-member Supabase configuration: ${missing.join(', ')}`,
    );
  }

  return {
    supabaseUrl,
    publishableKey,
    secretKey,
  };
}

function readFirst(readEnv: EnvReader, names: string[]) {
  for (const name of names) {
    const value = readEnv(name)?.trim();

    if (value) {
      return value;
    }
  }

  return '';
}

function readKeyDictionary(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    const keys = JSON.parse(raw) as Record<string, unknown>;
    const defaultKey = keys.default;

    if (typeof defaultKey === 'string' && defaultKey.trim()) {
      return defaultKey.trim();
    }

    return (
      Object.values(keys)
        .find(
          (value): value is string =>
            typeof value === 'string' && Boolean(value.trim()),
        )
        ?.trim() ?? null
    );
  } catch {
    return null;
  }
}

function readDenoEnv(name: string) {
  return Deno.env.get(name);
}
