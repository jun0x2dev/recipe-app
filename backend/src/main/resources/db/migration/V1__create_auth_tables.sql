create table users (
    id bigserial primary key,
    email varchar(255),
    password varchar(255),
    nickname varchar(50) not null,
    profile_image_url text,
    role varchar(20) not null default 'USER',
    status varchar(20) not null default 'ACTIVE',
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    deleted_at timestamp
);

create unique index uk_users_email_not_null on users(email) where email is not null;
create index idx_users_role on users(role);
create index idx_users_status on users(status);

create table user_auth_providers (
    id bigserial primary key,
    user_id bigint not null references users(id),
    provider varchar(20) not null,
    provider_user_id varchar(255) not null,
    provider_email varchar(255),
    email_verified boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_auth_provider_user unique (provider, provider_user_id),
    constraint uk_user_provider unique (user_id, provider)
);

create index idx_auth_providers_user_id on user_auth_providers(user_id);

create table refresh_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id),
    token_hash varchar(255) not null unique,
    device_id varchar(100),
    expires_at timestamp not null,
    revoked_at timestamp,
    created_at timestamp not null default now()
);

create index idx_refresh_tokens_user_id on refresh_tokens(user_id);
create index idx_refresh_tokens_expires_at on refresh_tokens(expires_at);
