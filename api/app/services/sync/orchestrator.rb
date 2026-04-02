module Sync
  class Orchestrator
    def initialize(user, from:, to:, account_types: nil)
      @user = user
      @from = from
      @to = to
      @account_types = account_types
    end

    def call
      log = @user.sync_logs.create!(
        status: "running",
        from_date: @from,
        to_date: @to,
        started_at: Time.current
      )

      begin
        accounts = AccountSyncer.new(@user).call
        accounts = accounts.select { |a| @account_types.include?(a.account_type) } if @account_types

        totals = {
          accounts_synced: accounts.size,
          transactions_created: 0,
          transactions_updated: 0,
          transactions_skipped: 0
        }

        accounts.each do |account|
          stats = TransactionIngester.new(account, from: @from, to: @to).call
          totals[:transactions_created] += stats[:created]
          totals[:transactions_updated] += stats[:updated]
          totals[:transactions_skipped] += stats[:skipped]
        end

        log.complete!(totals)
        log
      rescue => e
        log.fail!(e.message)
        raise
      end
    end
  end
end
