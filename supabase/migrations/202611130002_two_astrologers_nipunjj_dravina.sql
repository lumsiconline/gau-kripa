-- Replace the 3 initial astrologers with Nipunjj and Dravina and allow Super Admin media overwrites
delete from public.astrologers
where id in ('dr-sophia', 'acharya-rohan', 'maria-kapoor');

insert into public.astrologers (
  id, name, title, experience, rating, reviews_count, rate_per_min, crop_key,
  languages, bio, specializations, is_online, total_consultations, total_earnings
) values
  (
    'nipunjj',
    'Nipunjj',
    'Numerology, Vedic, Tarot & Palmistry Expert',
    '7+ Years Experience',
    4.9,
    '5239+ Readings',
    20,
    'astroRohan',
    '["Hindi","English"]'::jsonb,
    'Trusted Numerology, Vedic Astrology, Tarot, and Palmistry specialist with 7+ years of experience and 5239+ readings completed for career, marriage, and life clarity.',
    '["Numerology","Vedic","Tarot","Palmistry"]'::jsonb,
    true,
    5239,
    104780
  ),
  (
    'dravina',
    'Dravina',
    'Senior Vedic & Tarot Expert',
    '10+ Years Experience',
    4.9,
    '7648+ Readings',
    20,
    'astroSophia',
    '["Hindi","English"]'::jsonb,
    'Seasoned Vedic Astrologer and intuitive Tarot reader with 10+ years of experience and 7648+ readings completed, offering clear Kundali, relationship, and remedial guidance.',
    '["Vedic","Tarot"]'::jsonb,
    true,
    7648,
    152960
  )
on conflict (id) do update
set
  name = excluded.name,
  title = excluded.title,
  experience = excluded.experience,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  rate_per_min = excluded.rate_per_min,
  crop_key = excluded.crop_key,
  languages = excluded.languages,
  bio = excluded.bio,
  specializations = excluded.specializations,
  total_consultations = greatest(public.astrologers.total_consultations, excluded.total_consultations);

update public.chat_sessions
set astrologer_id = 'dravina', astrologer_name = 'Dravina'
where astrologer_id = 'dr-sophia';

update public.chat_sessions
set astrologer_id = 'nipunjj', astrologer_name = 'Nipunjj'
where astrologer_id in ('acharya-rohan', 'maria-kapoor');

drop policy if exists "gaukripa_media_admin_update" on storage.objects;
create policy "gaukripa_media_admin_update" on storage.objects
  for update using (bucket_id = 'gaukripa-media' and public.is_super_admin());
