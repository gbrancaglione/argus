module Api
  class TransactionsController < ApplicationController
    before_action :authenticate!

    def index
      data = OpenFinance.client.transactions(
        account_id: params.require(:account_id),
        from: params.require(:from),
        to: params.require(:to),
        page: params.fetch(:page, 1),
        page_size: params.fetch(:page_size, 50)
      )
      render json: data
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    def update
      transaction = current_user.transactions.find(params[:id])
      updates = {}

      if params.key?(:label_id)
        updates[:label] = params[:label_id].present? ? current_user.labels.find(params[:label_id]) : nil
        updates[:category_edited] = true
      end

      updates[:description] = params[:description] if params.key?(:description)

      transaction.update!(updates) if updates.any?
      render json: TransactionSerializer.new(transaction.reload).as_json
    rescue ActiveRecord::RecordNotFound => e
      render json: { error: "#{e.model || 'Resource'} not found" }, status: :not_found
    end

    def destroy
      transaction = current_user.transactions.find(params[:id])
      transaction.soft_delete!
      head :no_content
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Transaction not found" }, status: :not_found
    end

    def summary
      result = Transactions::SummaryService.new(
        account_id: params.require(:account_id),
        from: params.require(:from),
        to: params.require(:to)
      ).call

      render json: result
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end
  end
end
