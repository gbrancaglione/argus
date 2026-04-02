require "test_helper"

class SyncLogSerializerTest < ActiveSupport::TestCase
  test "as_json returns all sync log attributes" do
    log = sync_logs(:completed_sync)
    result = SyncLogSerializer.new(log).as_json

    assert_equal log.id, result[:id]
    assert_equal "completed", result[:status]
    assert_equal Date.parse("2026-03-01"), result[:from_date]
    assert_equal Date.parse("2026-03-31"), result[:to_date]
    assert_equal 2, result[:accounts_synced]
    assert_equal 10, result[:transactions_created]
    assert_equal 0, result[:transactions_updated]
    assert_equal 5, result[:transactions_skipped]
    assert_nil result[:error_message]
    assert_not_nil result[:started_at]
    assert_not_nil result[:finished_at]
  end

  test "as_json includes error message for failed syncs" do
    log = sync_logs(:failed_sync)
    result = SyncLogSerializer.new(log).as_json

    assert_equal "failed", result[:status]
    assert_equal "Connection timed out", result[:error_message]
  end

  test "many serializes a collection" do
    logs = [sync_logs(:completed_sync), sync_logs(:failed_sync)]
    result = SyncLogSerializer.many(logs)

    assert_equal 2, result.size
    assert_equal "completed", result[0][:status]
    assert_equal "failed", result[1][:status]
  end
end
