module Api
  class SyncTransactionsController < ApplicationController
    before_action :authenticate!

    def index
      sync_log = current_user.sync_logs.find(params[:sync_id])
      scope = sync_log.transactions.includes(:label).order(date: :desc, created_at: :desc)
      scope = scope.where(sync_action: params[:sync_action]) if params[:sync_action].present?

      page = params.fetch(:page, 1).to_i
      per_page = params.fetch(:per_page, 50).to_i
      total = scope.count
      total_pages = [(total.to_f / per_page).ceil, 1].max
      records = scope.offset((page - 1) * per_page).limit(per_page)

      render json: {
        results: TransactionSerializer.many(records),
        page: page,
        total: total,
        total_pages: total_pages
      }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Sync log not found" }, status: :not_found
    end
  end
end
