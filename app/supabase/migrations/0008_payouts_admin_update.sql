-- Phase 5: admin needs to mark a requested payout as paid (manual settlement for MVP --
-- no auto-disbursement). 0003_rls.sql only gave payouts a select + insert policy.

drop policy if exists "payouts: admin update" on payouts;
create policy "payouts: admin update" on payouts for update
  using (is_admin())
  with check (is_admin());
