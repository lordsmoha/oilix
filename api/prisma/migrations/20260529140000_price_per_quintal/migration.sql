-- Tarification affichée et stockée par quintal (دج/ق). 1 ق = 100 kg.
UPDATE "settings"
SET
  "key" = 'price_per_quintal',
  "value" = to_jsonb(
    CASE
      WHEN jsonb_typeof("value") = 'number' THEN (("value")::text)::numeric * 100
      ELSE (("value")::text)::numeric * 100
    END
  )
WHERE "key" = 'price_per_kg';
