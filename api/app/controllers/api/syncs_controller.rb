module Api
  class SyncsController < ApplicationController
    before_action :authenticate!

    def create
      log = Sync::Orchestrator.new(
        current_user,
        from: params.require(:from),
        to: params.require(:to),
        account_types: params[:account_types]
      ).call

      render json: SyncLogSerializer.new(log).as_json, status: :created
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    def index
      logs = current_user.sync_logs.recent.limit(20)
      render json: SyncLogSerializer.many(logs)
    end
  end
end
