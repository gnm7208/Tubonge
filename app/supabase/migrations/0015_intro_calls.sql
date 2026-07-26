-- Phase 11: free 15-min intro call. Reuses bookings/availability_slots as-is and skips Pesapal
-- entirely -- amount_kes = 0, status set to 'confirmed' immediately (no payment to wait on, so
-- no payments row gets created for intro calls either). The booking reuses the therapist's full
-- slot window like any other 1:1 session; "15-min" is a norm for the call's actual length, not a
-- schema-enforced cutoff -- there's nowhere in the schema a booking-specific end time would live
-- without duplicating what availability_slots.ends_at already provides.

alter table bookings add column is_intro boolean not null default false;

-- One free intro per client-therapist pair.
create unique index bookings_client_therapist_intro_uniq on bookings (client_id, therapist_id) where is_intro;
