create table recipes (
    id bigserial primary key,
    user_id bigint not null references users(id),
    title varchar(120) not null,
    description text,
    cooking_time_minutes integer,
    visibility varchar(20) not null default 'PRIVATE',
    view_count bigint not null default 0,
    like_count bigint not null default 0,
    share_count bigint not null default 0,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    deleted_at timestamp
);

create index idx_recipes_user_id on recipes(user_id);
create index idx_recipes_visibility on recipes(visibility);
create index idx_recipes_created_at on recipes(created_at);

create table recipe_ingredients (
    id bigserial primary key,
    recipe_id bigint not null references recipes(id) on delete cascade,
    name varchar(120) not null,
    amount varchar(120),
    sort_order integer not null
);

create index idx_recipe_ingredients_recipe_id on recipe_ingredients(recipe_id);

create table recipe_steps (
    id bigserial primary key,
    recipe_id bigint not null references recipes(id) on delete cascade,
    description text not null,
    sort_order integer not null
);

create index idx_recipe_steps_recipe_id on recipe_steps(recipe_id);
