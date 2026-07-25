-- Phase 6: abandoned checkouts (client closes the tab, payment never completes, no IPN ever
-- arrives) leave a booking stuck `pending_payment` and its slot stuck `held` forever. Expire
-- anything older than 30 minutes on a schedule.

create extension if not exists pg_cron;

create or replace function expire_stale_bookings()
returns void language plpgsql security definer set search_path = public as $$
declare
  stale_booking_ids uuid[];
begin
  select array_agg(id) into stale_booking_ids
  from bookings
  where status = 'pending_payment' and created_at < now() - interval '30 minutes';

  if stale_booking_ids is null then
    return;
  end if;

  update bookings set status = 'cancelled' where id = any(stale_booking_ids);

  update availability_slots
  set status = 'open'
  where status = 'held'
    and id in (select slot_id from bookings where id = any(stale_booking_ids));

  update payments
  set status = 'failed'
  where status = 'pending'
    and booking_id = any(stale_booking_ids);
end;
$$;

select cron.schedule('expire-stale-bookings', '*/10 * * * *', $$select expire_stale_bookings();$$);
