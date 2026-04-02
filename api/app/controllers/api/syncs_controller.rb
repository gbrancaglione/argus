module Api
  class SyncsController < ApplicationController
    before_action :authenticate!

    def create
      from = params.require(:from)
      to = params.require(:to)
      account_types = params[:account_types]

      log = Sync::Orchestrator.new(
        current_user,
        from: from,
        to: to,
        account_types: account_types
      ).call

      render json: serialize(log), status: :created
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    def index
      logs = current_user.sync_logs.recent.limit(20)
      render json: logs.map { |l| serialize(l) }
    end

    private

    def serialize(log)
      {
        id: log.id,
        status: log.status,
        from_date: log.from_date,
        to_date: log.to_date,
        accounts_synced: log.accounts_synced,
        transactions_created: log.transactions_created,
        transactions_updated: log.transactions_updated,
        transactions_skipped: log.transactions_skipped,
        error_message: log.error_message,
        started_at: log.started_at,
        finished_at: log.finished_at
      }
    end
  end
end
