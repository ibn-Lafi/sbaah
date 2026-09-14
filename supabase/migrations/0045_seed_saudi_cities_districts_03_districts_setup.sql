
drop table if exists _seed_districts;
create table _seed_districts (
  seed_id uuid primary key,
  city_seed_id uuid not null,
  name_ar text not null,
  name_en text not null,
  lat double precision,
  lng double precision
);

