-- Isolated MotoShop objects for an existing shared Supabase project.
-- Apply this file only on shared cloud; the initial migration is a local legacy baseline.
-- No existing tables, functions, buckets or Auth settings are altered.

create table public.moto_categories (
  id text primary key, name text not null, slug text unique not null,
  type text not null check (type in ('gasoline','electric','accessory')), created_at timestamptz not null default now()
);
insert into public.moto_categories (id,name,slug,type) values
  ('gasoline','Xe xăng','xe-xang','gasoline'), ('electric','Xe điện','xe-dien','electric'), ('accessory','Phụ kiện','phu-kien','accessory');

create table public.moto_products (
  id text primary key default gen_random_uuid()::text,
  category_id text references public.moto_categories(id) on delete set null,
  name text not null, slug text unique not null, brand text not null,
  type text not null check (type in ('gasoline','electric','accessory')),
  price_original bigint not null check (price_original >= 0),
  price_sale bigint check (price_sale >= 0 and price_sale <= price_original),
  is_electric boolean not null default false, featured boolean not null default false,
  in_stock boolean not null default true, published boolean not null default true,
  description text not null default '', engine_cc numeric, motor_kw numeric, battery_kwh numeric,
  range_km numeric, seat_height numeric, brake text not null default '',
  source_url text not null default '', source_date text not null default '', price_note text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index moto_products_type_brand_idx on public.moto_products(type,brand) where published;
create table public.moto_product_variants (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.moto_products(id) on delete cascade,
  color_name text not null, color_hex text not null check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  image_urls text[] not null, stock_quantity integer not null default 0 check (stock_quantity >= 0)
);
create index moto_product_variants_product_idx on public.moto_product_variants(product_id);
create table public.moto_specifications (
  id uuid primary key default gen_random_uuid(), product_id text not null references public.moto_products(id) on delete cascade,
  spec_key text not null, spec_value text not null, group_name text not null default 'Thông số chung', sort_order integer not null default 0
);
create index moto_specifications_product_idx on public.moto_specifications(product_id);
create table public.moto_site_settings (
  id integer primary key default 1 check (id = 1), site_name text not null default 'MotoShop Việt Nam',
  logo_url text, primary_color text not null default '#EF4444', hero_banners jsonb not null default '[]',
  contact_phone text, address text, config jsonb not null, updated_at timestamptz not null default now()
);
create table public.moto_test_drives (
  id uuid primary key default gen_random_uuid(), product_id text references public.moto_products(id) on delete set null,
  product_name text not null, full_name text not null, phone text not null, email text not null default '',
  preferred_date date not null, preferred_time time not null, preferred_location text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','purchased','cancelled')),
  notes text not null default '', created_at timestamptz not null default now()
);
create table public.moto_orders (
  id uuid primary key default gen_random_uuid(), code text unique not null,
  full_name text not null, phone text not null, email text not null default '', address text not null, notes text not null default '',
  payment_method text not null check (payment_method in ('cod','bank')),
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  total bigint not null check (total >= 0), deposit bigint not null check (deposit >= 0 and deposit <= total),
  bank_account text not null default '', bank_bin text not null default '', bank_name text not null default '',
  idempotency_key text unique not null, fingerprint text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index moto_orders_created_idx on public.moto_orders(created_at desc);
create index moto_test_drives_created_idx on public.moto_test_drives(created_at desc);
create table public.moto_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.moto_orders(id) on delete cascade,
  product_id text not null, variant_id text not null, name text not null, color text not null, image text not null default '',
  quantity integer not null check (quantity between 1 and 10), unit_price bigint not null check (unit_price >= 0)
);
create index moto_order_items_order_idx on public.moto_order_items(order_id);
create table public.moto_payment_events (
  id text primary key, order_id uuid not null references public.moto_orders(id), amount bigint not null check (amount >= 0), created_at timestamptz not null default now()
);
create table public.moto_rate_limits (key text primary key, count integer not null, expires_at timestamptz not null);

alter table public.moto_categories enable row level security;
alter table public.moto_products enable row level security;
alter table public.moto_product_variants enable row level security;
alter table public.moto_specifications enable row level security;
alter table public.moto_site_settings enable row level security;
alter table public.moto_test_drives enable row level security;
alter table public.moto_orders enable row level security;
alter table public.moto_order_items enable row level security;
alter table public.moto_payment_events enable row level security;
alter table public.moto_rate_limits enable row level security;

grant select on public.moto_categories,public.moto_products,public.moto_product_variants,public.moto_specifications,public.moto_site_settings to anon,authenticated;
grant select,insert,update,delete on public.moto_categories,public.moto_products,public.moto_product_variants,public.moto_specifications,public.moto_site_settings,public.moto_orders,public.moto_order_items,public.moto_test_drives to authenticated;
grant all on public.moto_categories,public.moto_products,public.moto_product_variants,public.moto_specifications,public.moto_site_settings,public.moto_orders,public.moto_order_items,public.moto_test_drives,public.moto_payment_events,public.moto_rate_limits to service_role;
create policy moto_public_categories on public.moto_categories for select using (true);
create policy moto_public_products on public.moto_products for select using (published);
create policy moto_public_variants on public.moto_product_variants for select using (exists(select 1 from public.moto_products p where p.id=product_id and p.published));
create policy moto_public_specifications on public.moto_specifications for select using (exists(select 1 from public.moto_products p where p.id=product_id and p.published));
create policy moto_public_site_settings on public.moto_site_settings for select using (true);

create policy moto_admin_categories on public.moto_categories for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_products on public.moto_products for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_variants on public.moto_product_variants for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_specifications on public.moto_specifications for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_site_settings on public.moto_site_settings for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_test_drives on public.moto_test_drives for all to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_orders on public.moto_orders for select to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_order_items on public.moto_order_items for select to authenticated using ((select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
-- Orders and inventory are changed only through server RPC transactions.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('moto-product-images','moto-product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict (id) do nothing;
create policy moto_admin_image_insert on storage.objects for insert to authenticated with check (bucket_id='moto-product-images' and (select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_image_update on storage.objects for update to authenticated using (bucket_id='moto-product-images' and (select auth.jwt())->'app_metadata'->>'motoshop_role'='admin') with check (bucket_id='moto-product-images' and (select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
create policy moto_admin_image_delete on storage.objects for delete to authenticated using (bucket_id='moto-product-images' and (select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');

create function public.moto_upsert_product(p_product jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare v jsonb; s jsonb; n integer:=0;
begin
  insert into public.moto_products(id,category_id,name,slug,brand,type,price_original,price_sale,is_electric,featured,in_stock,published,description,engine_cc,motor_kw,battery_kwh,range_km,seat_height,brake,source_url,source_date,price_note,created_at)
  values(p_product->>'id',p_product->>'type',p_product->>'name',p_product->>'slug',p_product->>'brand',p_product->>'type',(p_product->>'price')::bigint,(p_product->>'salePrice')::bigint,p_product->>'type'='electric',(p_product->>'featured')::boolean,(p_product->>'inStock')::boolean,(p_product->>'published')::boolean,p_product->>'description',(p_product->>'engineCc')::numeric,(p_product->>'motorKw')::numeric,(p_product->>'batteryKwh')::numeric,(p_product->>'rangeKm')::numeric,(p_product->>'seatHeight')::numeric,p_product->>'brake',p_product->>'sourceUrl',p_product->>'sourceDate',p_product->>'priceNote',(p_product->>'createdAt')::timestamptz)
  on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,brand=excluded.brand,type=excluded.type,price_original=excluded.price_original,price_sale=excluded.price_sale,is_electric=excluded.is_electric,featured=excluded.featured,in_stock=excluded.in_stock,published=excluded.published,description=excluded.description,engine_cc=excluded.engine_cc,motor_kw=excluded.motor_kw,battery_kwh=excluded.battery_kwh,range_km=excluded.range_km,seat_height=excluded.seat_height,brake=excluded.brake,source_url=excluded.source_url,source_date=excluded.source_date,price_note=excluded.price_note,updated_at=now();
  for v in select value from jsonb_array_elements(p_product->'variants') loop
    -- A variant ID must never be moved from another product.
    if exists(select 1 from public.moto_product_variants where id=v->>'id' and product_id<>p_product->>'id') then raise exception 'VARIANT_CONFLICT'; end if;
    insert into public.moto_product_variants(id,product_id,color_name,color_hex,image_urls,stock_quantity)
    values(v->>'id',p_product->>'id',v->>'colorName',v->>'colorHex',array(select jsonb_array_elements_text(v->'images')),(v->>'stock')::integer)
    on conflict(id) do update set color_name=excluded.color_name,color_hex=excluded.color_hex,image_urls=excluded.image_urls,stock_quantity=excluded.stock_quantity;
  end loop;
  delete from public.moto_product_variants where product_id=p_product->>'id' and id not in(select value->>'id' from jsonb_array_elements(p_product->'variants'));
  delete from public.moto_specifications where product_id=p_product->>'id';
  for s in select value from jsonb_array_elements(p_product->'specs') loop
    insert into public.moto_specifications(product_id,spec_key,spec_value,group_name,sort_order) values(p_product->>'id',s->>'key',s->>'value',s->>'group',n); n:=n+1;
  end loop;
end $$;

create function public.moto_order_json(p_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',o.id,'code',o.code,'fullName',o.full_name,'phone',o.phone,'email',o.email,'address',o.address,'notes',o.notes,'paymentMethod',o.payment_method,'status',o.status,'paymentStatus',o.payment_status,'total',o.total,'deposit',o.deposit,'createdAt',o.created_at,'bankAccount',o.bank_account,'bankBin',o.bank_bin,'bankName',o.bank_name,'items',coalesce((select jsonb_agg(jsonb_build_object('productId',i.product_id,'variantId',i.variant_id,'name',i.name,'color',i.color,'image',i.image,'quantity',i.quantity,'unitPrice',i.unit_price)) from public.moto_order_items i where i.order_id=o.id),'[]'::jsonb))
  from public.moto_orders o where o.id=p_id;
$$;

create function public.moto_create_order(p_input jsonb,p_fingerprint text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare previous public.moto_orders; cfg jsonb; oid uuid:=gen_random_uuid(); item jsonb; p public.moto_products; v public.moto_product_variants; qty integer; total_amount bigint:=0; unit_amount bigint; deposit_amount bigint; method text:=p_input->>'paymentMethod';
begin
  perform pg_advisory_xact_lock(hashtextextended(p_input->>'idempotencyKey',0));
  select * into previous from public.moto_orders where idempotency_key=p_input->>'idempotencyKey';
  if found then
    if previous.fingerprint<>p_fingerprint then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return public.moto_order_json(previous.id);
  end if;
  select config into cfg from public.moto_site_settings where id=1;
  if cfg is null then raise exception 'SETTINGS_NOT_CONFIGURED'; end if;
  if method='bank' and (coalesce(cfg->>'bankAccount','')='' or coalesce(cfg->>'bankBin','')='' or coalesce(cfg->>'bankName','')='') then raise exception 'BANK_NOT_CONFIGURED'; end if;
  if jsonb_array_length(p_input->'items') not between 1 and 30 then raise exception 'INVALID_ITEMS'; end if;
  if (select count(*) from jsonb_array_elements(p_input->'items'))<>(select count(distinct (value->>'productId',value->>'variantId')) from jsonb_array_elements(p_input->'items')) then raise exception 'INVALID_ITEMS'; end if;
  insert into public.moto_orders(id,code,full_name,phone,email,address,notes,payment_method,total,deposit,idempotency_key,fingerprint,bank_account,bank_bin,bank_name)
  values(oid,'MS'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),p_input->>'fullName',p_input->>'phone',coalesce(p_input->>'email',''),p_input->>'address',coalesce(p_input->>'notes',''),method,0,0,p_input->>'idempotencyKey',p_fingerprint,coalesce(cfg->>'bankAccount',''),coalesce(cfg->>'bankBin',''),coalesce(cfg->>'bankName',''));
  for item in select value from jsonb_array_elements(p_input->'items') order by value->>'productId',value->>'variantId' loop
    qty:=(item->>'quantity')::integer;
    select * into p from public.moto_products where id=item->>'productId' and published and in_stock for share;
    if not found then raise exception 'OUT_OF_STOCK'; end if;
    select * into v from public.moto_product_variants where id=item->>'variantId' and product_id=p.id for update;
    if not found or qty<1 or qty>10 or v.stock_quantity<qty then raise exception 'OUT_OF_STOCK'; end if;
    unit_amount:=coalesce(p.price_sale,p.price_original); total_amount:=total_amount+qty*unit_amount;
    update public.moto_product_variants set stock_quantity=stock_quantity-qty where id=v.id;
    insert into public.moto_order_items(order_id,product_id,variant_id,name,color,image,quantity,unit_price) values(oid,p.id,v.id,p.name,v.color_name,coalesce(v.image_urls[1],''),qty,unit_amount);
  end loop;
  deposit_amount:=case when method='bank' then ceil(total_amount*(cfg->>'depositPercent')::numeric/100)::bigint else 0 end;
  update public.moto_orders set total=total_amount,deposit=deposit_amount where id=oid;
  return public.moto_order_json(oid);
end $$;

create function public.moto_update_order_status(p_id uuid,p_status text,p_payment_status text default null) returns void language plpgsql security invoker set search_path='' as $$
declare o public.moto_orders; i public.moto_order_items;
begin
  select * into o from public.moto_orders where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if (o.status='cancelled' and p_status<>'cancelled') or (o.status='completed' and p_status='cancelled') or (o.payment_status='paid' and p_payment_status='unpaid') then raise exception 'INVALID_TRANSITION'; end if;
  if p_status='cancelled' and o.status<>'cancelled' then
    for i in select * from public.moto_order_items where order_id=o.id order by variant_id loop
      update public.moto_product_variants set stock_quantity=stock_quantity+i.quantity where id=i.variant_id and product_id=i.product_id;
    end loop;
  end if;
  update public.moto_orders set status=p_status,payment_status=coalesce(p_payment_status,payment_status),updated_at=now() where id=p_id;
end $$;

create function public.moto_apply_payment(p_event_id text,p_code text,p_amount bigint,p_account text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.moto_orders;
begin
  perform pg_advisory_xact_lock(hashtextextended('payment:'||p_event_id,0));
  if exists(select 1 from public.moto_payment_events where id=p_event_id) then return jsonb_build_object('success',true,'duplicate',true); end if;
  select * into o from public.moto_orders where code=p_code and bank_account=p_account and payment_method='bank' for update;
  if not found or o.status='cancelled' or o.deposit<=0 or p_amount<o.deposit then return jsonb_build_object('success',true,'matched',false); end if;
  insert into public.moto_payment_events(id,order_id,amount) values(p_event_id,o.id,p_amount);
  update public.moto_orders set payment_status='paid',updated_at=now() where id=o.id;
  return jsonb_build_object('success',true,'matched',true);
end $$;

create function public.moto_consume_rate_limit(p_key text,p_maximum integer,p_seconds integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare hits integer;
begin
  insert into public.moto_rate_limits(key,count,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set count=case when public.moto_rate_limits.expires_at<=now() then 1 else public.moto_rate_limits.count+1 end,expires_at=case when public.moto_rate_limits.expires_at<=now() then now()+make_interval(secs=>p_seconds) else public.moto_rate_limits.expires_at end returning count into hits;
  if random()<0.01 then delete from public.moto_rate_limits where expires_at<now()-interval '1 hour'; end if;
  return hits<=p_maximum;
end $$;

create function public.moto_get_sales_counts() returns jsonb language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_object_agg(product_id,quantity),'{}'::jsonb) from
  (select i.product_id,sum(i.quantity) as quantity from public.moto_order_items i join public.moto_orders o on o.id=i.order_id where o.status='completed' group by i.product_id) counts;
$$;

revoke all on function public.moto_upsert_product(jsonb),public.moto_order_json(uuid),public.moto_create_order(jsonb,text),public.moto_update_order_status(uuid,text,text),public.moto_apply_payment(text,text,bigint,text),public.moto_consume_rate_limit(text,integer,integer),public.moto_get_sales_counts() from public,anon,authenticated;
grant execute on function public.moto_upsert_product(jsonb),public.moto_order_json(uuid),public.moto_create_order(jsonb,text),public.moto_update_order_status(uuid,text,text),public.moto_apply_payment(text,text,bigint,text),public.moto_consume_rate_limit(text,integer,integer),public.moto_get_sales_counts() to service_role;

-- Admin tables are eligible for Realtime; their RLS policies still protect customer details.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.moto_orders, public.moto_test_drives;
  end if;
end $$;

create index moto_products_category_idx on public.moto_products(category_id);
create index moto_test_drives_product_idx on public.moto_test_drives(product_id);
create index moto_payment_events_order_idx on public.moto_payment_events(order_id);
create policy moto_admin_image_select on storage.objects for select to authenticated using (bucket_id='moto-product-images' and (select auth.jwt())->'app_metadata'->>'motoshop_role'='admin');
