create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  sub text,
  platform text not null,
  code text not null,
  kind text not null default '',
  aspect text not null default 'landscape',
  title text not null,
  detail text not null default '',
  thumb text not null default '',
  link text not null default '',
  featured boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.videos to anon;
grant select on public.videos to authenticated;
grant insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

create policy "Anyone can read videos" on public.videos for select to anon, authenticated using (true);
create policy "Admins can insert videos" on public.videos for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update videos" on public.videos for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete videos" on public.videos for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.videos (section, sub, platform, code, kind, aspect, title, detail, thumb, link, featured, position) values
('start',NULL,'instagram','DcOVIS-hYFM','p','landscape','Brand episode EP.01','documentary cafe cut with interview audio','','https://www.instagram.com/p/DcOVIS-hYFM/',true,0),
('start','Teaser','youtube','FiM8u5WwFqY','watch','portrait','Wedding teaser','cinematic day cut, vows over highlights','','https://youtu.be/FiM8u5WwFqY',true,1),
('start',NULL,'youtube','Xs7fZwrrm1k','shorts','portrait','Podcast reel','hook-first cutdown, burned captions, punch-ins','','https://youtube.com/shorts/Xs7fZwrrm1k?feature=share',true,2),
('start',NULL,'instagram','DcByFKtKArh','p','4x5','Travel reel','24-hour city cut with whip-pan transitions','','https://www.instagram.com/p/DcByFKtKArh/',true,3),
('start',NULL,'youtube','93ae6RAZvyk','watch','landscape','Music video','performance cover cut on lyric rhythm, film grade','','https://youtu.be/93ae6RAZvyk',true,4),
('start',NULL,'youtube','Htwl7paWltc','shorts','portrait','Event recap','library launch session cut with ambient audio','','https://youtube.com/shorts/Htwl7paWltc?feature=share',true,5),
('brands',NULL,'instagram','DVLtg40GFvd','p','landscape','Cafe brand reel','ambient slow cut with on-screen type','/assets/thumbs/00.webp','https://www.instagram.com/p/DVLtg40GFvd/',false,6),
('brands',NULL,'youtube','AyzYq_UUWw4','shorts','portrait','BTS reel','behind-the-scenes selects cut on beat for launch','/assets/thumbs/01.webp','https://youtube.com/shorts/AyzYq_UUWw4?feature=share',false,7),
('brands',NULL,'instagram','DPG2_8CCVIR','p','landscape','Campaign film','product-led cut, motion type, clean grade','/assets/thumbs/02.webp','https://www.instagram.com/p/DPG2_8CCVIR/',false,8),
('brands',NULL,'vimeo','809772240','video','landscape','Fashion concept film','AW22 lookbook cut on rhythm','/assets/thumbs/03.webp','https://vimeo.com/809772240?share=copy&fl=sv&fe=ci',false,9),
('brands',NULL,'instagram','DMvIfFbv899','p','landscape','Product reveal','candlelit pack launch, macro detail, warm grade','/assets/thumbs/04.webp','https://www.instagram.com/p/DMvIfFbv899/',false,10),
('brands',NULL,'instagram','DQoo446k1Sa','p','landscape','Brand mood reel','low-light ambience edit on texture and pace','/assets/thumbs/05.webp','https://www.instagram.com/p/DQoo446k1Sa/',false,11),
('brands',NULL,'vimeo','1089372399','video','landscape','Brand event recap','book-fair coverage cut to a tight promo','/assets/thumbs/06.webp','https://vimeo.com/1089372399?share=copy',false,12),
('brands',NULL,'instagram','DcOVIS-hYFM','p','landscape','Brand episode EP.01','documentary cafe cut with interview audio','/assets/thumbs/07.webp','https://www.instagram.com/p/DcOVIS-hYFM/',false,13),
('weddings','Teaser','instagram','DTCw5o8EuTo','p','landscape','Wedding teaser','interview-led story, multi-day footage to 60s','/assets/thumbs/08.webp','https://www.instagram.com/p/DTCw5o8EuTo/',false,14),
('weddings','Teaser','youtube','FiM8u5WwFqY','watch','portrait','Wedding teaser','cinematic day cut, vows over highlights','/assets/thumbs/09.webp','https://youtu.be/FiM8u5WwFqY',false,15),
('weddings','Teaser','youtube','n00jKOWNkWA','watch','landscape','Wedding teaser','same-day edit cut for social release','/assets/thumbs/10.webp','https://youtu.be/n00jKOWNkWA',false,16),
('weddings','Teaser','youtube','0aE-UoaBM1M','watch','landscape','Wedding teaser','ritual-focused cut on traditional music bed','/assets/thumbs/11.webp','https://youtu.be/0aE-UoaBM1M',false,17),
('weddings','Teaser','youtube','psdmUGWJIKs','watch','landscape','Wedding teaser','emotion-first build, slow ramps into the drop','/assets/thumbs/12.webp','https://youtu.be/psdmUGWJIKs',false,18),
('weddings','Teaser','vimeo','809883854','video','landscape','Wedding teaser','cinematic grade with an audio-driven build','/assets/thumbs/13.webp','https://vimeo.com/809883854?share=copy#t=0',false,19),
('weddings','Highlight','youtube','bhu-BE4t27Y','watch','landscape','Wedding highlight','4-min film from two-day multi-cam coverage','/assets/thumbs/14.webp','https://youtu.be/bhu-BE4t27Y',false,20),
('weddings','Highlight','vimeo','1089374583','video','landscape','Bride highlight','haldi detail cut, macro sequencing, soft grade','/assets/thumbs/15.webp','https://vimeo.com/1089374583?share=copy#t=0',false,21),
('weddings','Reel','youtube','cNddJLrKFwE','shorts','portrait','Vertical wedding reel','getting-ready moments cut to trend audio','/assets/thumbs/16.webp','https://youtube.com/shorts/cNddJLrKFwE?feature=share',false,22),
('weddings','Reel','youtube','94j_jG4AWZc','shorts','portrait','Vertical wedding reel','couple portrait cut with speed ramps','/assets/thumbs/17.webp','https://youtube.com/shorts/94j_jG4AWZc?feature=share',false,23),
('weddings','Reel','youtube','PGf1mhYZWDM','shorts','portrait','Vertical barat reel','high-energy procession cut on beat','/assets/thumbs/18.webp','https://youtube.com/shorts/PGf1mhYZWDM?feature=share',false,24),
('events',NULL,'youtube','Htwl7paWltc','shorts','portrait','Event recap','library launch session cut with ambient audio','/assets/thumbs/19.webp','https://youtube.com/shorts/Htwl7paWltc?feature=share',false,25),
('events',NULL,'instagram','DRj5MJdE5t2','p','landscape','Event aftermovie','community meetup recap, multi-angle cut','/assets/thumbs/20.webp','https://www.instagram.com/p/DRj5MJdE5t2/',false,26),
('events',NULL,'instagram','DSsTsZSk0Sq','p','landscape','Event promo','two-day board-game expo cut into a hype reel','','https://www.instagram.com/p/DSsTsZSk0Sq/',false,27),
('podcasts',NULL,'youtube','wVYEAjI7mcI','shorts','portrait','Podcast cutdown','long-form to vertical with animated captions','/assets/thumbs/22.webp','https://youtube.com/shorts/wVYEAjI7mcI?feature=share',false,28),
('podcasts',NULL,'youtube','LOZOXXrs_Cg','watch','landscape','Podcast edit','multi-cam sync, audio clean-up, caption pass','/assets/thumbs/23.webp','https://youtu.be/LOZOXXrs_Cg',false,29),
('podcasts',NULL,'instagram','DPf0YuzCEeA','p','landscape','Podcast promo','studio session cutdown with kinetic type','/assets/thumbs/24.webp','https://www.instagram.com/p/DPf0YuzCEeA/',false,30),
('podcasts',NULL,'youtube','Xs7fZwrrm1k','shorts','portrait','Podcast reel','hook-first cutdown, burned captions, punch-ins','/assets/thumbs/25.webp','https://youtube.com/shorts/Xs7fZwrrm1k?feature=share',false,31),
('podcasts',NULL,'youtube','nZXvBY1rPkE','shorts','portrait','Podcast reel','argument-beat cutdown with subtitle emphasis','/assets/thumbs/26.webp','https://youtube.com/shorts/nZXvBY1rPkE?feature=share',false,32),
('travel',NULL,'instagram','DcByFKtKArh','p','4x5','Travel reel','24-hour city cut with whip-pan transitions','/assets/thumbs/27.webp','https://www.instagram.com/p/DcByFKtKArh/',false,33),
('travel',NULL,'instagram','DW1kfT2AMe8','p','landscape','Travel film','Kyoto slow-travel cut, season-matched grade','/assets/thumbs/28.webp','https://www.instagram.com/p/DW1kfT2AMe8/',false,34),
('travel',NULL,'instagram','DV8iK0yAOjB','reel','landscape','Creator reel','vertical travel moment cut to trending audio','/assets/thumbs/29.webp','https://www.instagram.com/reel/DV8iK0yAOjB/',false,35),
('travel',NULL,'vimeo','1098982278','video','landscape','Trek film','Himalayan trek doc cut from handheld footage','/assets/thumbs/30.webp','https://vimeo.com/1098982278?share=copy',false,36),
('travel',NULL,'instagram','DU8Y-9AD-RC','p','landscape','Festival travel reel','mountain festival story, native audio','/assets/thumbs/31.webp','https://www.instagram.com/p/DU8Y-9AD-RC/',false,37),
('music',NULL,'youtube','93ae6RAZvyk','watch','landscape','Music video','performance cover cut on lyric rhythm, film grade','/assets/thumbs/32.webp','https://youtu.be/93ae6RAZvyk',false,38),
('music',NULL,'youtube','Hv52-OHDL_k','watch','landscape','Music video','narrative cover edit synced to vocal phrasing','/assets/thumbs/33.webp','https://youtu.be/Hv52-OHDL_k',false,39);