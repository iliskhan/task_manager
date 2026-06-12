begin;

select plan(2);

select is(
  (
    select count(*)::int
    from auth.users
    where email in ('owner@example.com', 'member@example.com')
  ),
  2,
  'seeded auth users exist'
);

select ok(
  not exists (
    select 1
    from auth.users
    where email in ('owner@example.com', 'member@example.com')
      and (
        confirmation_token is null
        or recovery_token is null
        or email_change_token_new is null
        or email_change is null
        or email_change_token_current is null
        or reauthentication_token is null
      )
  ),
  'seeded auth users have non-null token fields required by GoTrue'
);

select * from finish();

rollback;
