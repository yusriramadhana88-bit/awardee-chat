-- Migration 014: revert persona LPDP Center dari Bima ke Den Dhana — hapus kolom mood
-- (tidak dipakai lagi) dan perbaiki judul achievement yang masih menyebut "Bima".
ALTER TABLE lpdp_doc_checks DROP COLUMN IF EXISTS mood;
ALTER TABLE lpdp_essay_reviews DROP COLUMN IF EXISTS mood;

UPDATE achievements SET title = 'Kenalan sama LPDP Center' WHERE code = 'lpdp_profile_set';
UPDATE achievements SET title = 'Esai Pertama Direview' WHERE code = 'lpdp_first_essay';
