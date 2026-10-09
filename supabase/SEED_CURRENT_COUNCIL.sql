-- Restores the 2026–27 boys' council that the site showed before the council tables existed.
-- Safe to run more than once. Does not replace a year you already saved under slug 2026-27.

insert into public.campus_council_years (
  label,
  slug,
  kind,
  summary,
  publication_status,
  sort_order,
  is_sample,
  published_at
)
select
  '2026–27',
  '2026-27',
  'current',
  'Boys'' student council for 2026–27.',
  'published',
  0,
  false,
  timezone('utc', now())
where not exists (
  select 1
  from public.campus_council_years
  where slug = '2026-27'
);

insert into public.campus_council_members (year_id, role, name, sort_order)
select year.id, added.role, added.name, added.sort_slot
from public.campus_council_years year
cross join (
  values
    (0, 'CCA Coordinator', 'JANATHUL FIRTHOSE'),
    (1, 'Head Boy', 'MOHAMMED REHAAN'),
    (2, 'Deputy Head Boy', 'DEVANSH RAJESH SINGH'),
    (3, 'Council Secretary', 'MOHAMMED SHAYAAN'),
    (4, 'Council Secretary Vice Captain', 'SRIRAM MENON'),
    (5, 'Activity Captain', 'AFHAM ABUBAKKER'),
    (6, 'Activity Vice Captain', 'YASH BHAVSAR'),
    (7, 'Sports Captain', 'ROHAN VISVAKARMA'),
    (8, 'Sports Vice Captain', 'MUHAMMAD SHIHAN'),
    (9, 'Ruby House Captain', 'ZAYAN JASSEER'),
    (10, 'Ruby House Vice Captain', 'DANIAL POULOSE'),
    (11, 'Emerald House Captain', 'MOHAMMED AAZIM'),
    (12, 'Emerald House Vice Captain', 'SHAZ MOHAMMED'),
    (13, 'Sapphire House Captain', 'ZAYAN MUHAMMED RIZAM'),
    (14, 'Sapphire House Vice Captain', 'SALAH MAHARUS NISAN'),
    (15, 'Topaz House Captain', 'MOHAMMED IHSAN'),
    (16, 'Topaz House Vice Captain', 'STEPHEN MASCARENHAS'),
    (17, 'Wellness Captain', 'MOHAMMED BILAL TARIQ'),
    (18, 'Wellness Vice Captain', 'NUAMAAN SHAIKH'),
    (19, 'Discipline Captain', 'PRANET PAUL'),
    (20, 'Discipline Vice Captain', 'HISHAM HASHEEF'),
    (21, 'Linguistic Captain', 'PRANEET SATHISH'),
    (22, 'Linguistic Vice Captain', 'ISSAM ISMAIL'),
    (23, 'Eco-Innovator Captain', 'SUMITH CHANDRA'),
    (24, 'Eco-Innovator Vice Captain', 'RISHIT RENOJ'),
    (25, 'Health & Nutrition Captain', 'AKBAR ADHIL'),
    (26, 'Health And Nutrition Vice Captain', 'JOSHUA EMMANUEL'),
    (27, 'Digital Defender Captain', 'AHAMED BILAL'),
    (28, 'Digital Defender Vice Captain', 'NITHISH BALAKRISHNAN'),
    (29, 'Inclusion Captain', 'MUHAMMED MUSTHAFA'),
    (30, 'Inclusion Vice Captain', 'ALVIN MANU'),
    (31, 'Community Outreach Captain', 'GHIYAS ABUBACKER'),
    (32, 'Community Outreach Vice Captain', 'MUHAMMAD AZHAR'),
    (33, 'Global Citizen Captain', 'SAMEETH'),
    (34, 'Global Citizen Vice Captain', 'ASWIN AJITHKUMAR'),
    (35, 'Young Entrepreneurship Captain', 'GURU PRAKASH'),
    (36, 'Young Entrepreneurship Vice Captain', 'ABHINAND VIMAL'),
    (37, 'Ethos Captain', 'MOHAMMED ALI'),
    (38, 'Ethos Vice Captain', 'UMER BILAL'),
    (39, 'Nex Gen Captain', 'RITVIK SAI'),
    (40, 'Nex Gen Vice Captain', 'ABHAY SIVANANDAN'),
    (41, 'Media Captain', 'ARMAN'),
    (42, 'Media Vice Captain', 'ZEBADIYA'),
    (43, 'Steam Captain', 'MUHAMMAD ZEHAL'),
    (44, 'Steam Vice Captain', 'ASWAS JOY')
) as added(sort_slot, role, name)
where year.slug = '2026-27'
  and not exists (
    select 1
    from public.campus_council_members existing
    where existing.year_id = year.id
      and existing.role = added.role
  );
