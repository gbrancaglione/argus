require "test_helper"

class SyncLogTest < ActiveSupport::TestCase
  test "valid sync log" do
    assert sync_logs(:completed_sync).valid?
  end

  test "requires status, dates, started_at" do
    log = SyncLog.new(user: users(:admin))
    assert_not log.valid?
    assert_includes log.errors[:from_date], "can't be blank"
    assert_includes log.errors[:to_date], "can't be blank"
    assert_includes log.errors[:started_at], "can't be blank"
  end

  test "complete! updates status and stats" do
    log = SyncLog.create!(
      user: users(:admin),
      status: "running",
      from_date: "2026-03-01",
      to_date: "2026-03-31",
      started_at: Time.current
    )

    log.complete!(
      accounts_synced: 2,
      transactions_created: 15,
      transactions_updated: 3,
      transactions_skipped: 5
    )

    log.reload
    assert_equal "completed", log.status
    assert_equal 2, log.accounts_synced
    assert_equal 15, log.transactions_created
    assert_equal 3, log.transactions_updated
    assert_equal 5, log.transactions_skipped
    assert_not_nil log.finished_at
  end

  test "fail! updates status and error message" do
    log = SyncLog.create!(
      user: users(:admin),
      status: "running",
      from_date: "2026-03-01",
      to_date: "2026-03-31",
      started_at: Time.current
    )

    log.fail!("API timeout")

    log.reload
    assert_equal "failed", log.status
    assert_equal "API timeout", log.error_message
    assert_not_nil log.finished_at
  end

  test "recent scope orders by started_at desc" do
    logs = users(:admin).sync_logs.recent
    assert_equal logs.first, sync_logs(:completed_sync)
  end
end
