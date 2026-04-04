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

    def approve
      sync_log = current_user.sync_logs.find(params[:id])
      return render json: { error: "Not pending approval" }, status: :unprocessable_entity unless sync_log.pending_approval?

      sync_log.approve!
      render json: SyncLogSerializer.new(sync_log).as_json
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Sync log not found" }, status: :not_found
    end

    def reject
      sync_log = current_user.sync_logs.find(params[:id])
      return render json: { error: "Not pending approval" }, status: :unprocessable_entity unless sync_log.pending_approval?

      sync_log.reject!
      render json: SyncLogSerializer.new(sync_log).as_json
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Sync log not found" }, status: :not_found
    end
  end
end
