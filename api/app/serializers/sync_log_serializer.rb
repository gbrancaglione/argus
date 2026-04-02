class SyncLogSerializer
  def initialize(sync_log)
    @sync_log = sync_log
  end

  def as_json
    {
      id: @sync_log.id,
      status: @sync_log.status,
      from_date: @sync_log.from_date,
      to_date: @sync_log.to_date,
      accounts_synced: @sync_log.accounts_synced,
      transactions_created: @sync_log.transactions_created,
      transactions_updated: @sync_log.transactions_updated,
      transactions_skipped: @sync_log.transactions_skipped,
      error_message: @sync_log.error_message,
      started_at: @sync_log.started_at,
      finished_at: @sync_log.finished_at
    }
  end

  def self.many(sync_logs)
    sync_logs.map { |l| new(l).as_json }
  end
end
